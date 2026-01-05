package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"golang/internal/logger"
	"golang/internal/model"
)

type OrderRepository struct {
	db *sql.DB
}

func NewOrderRepository(db *sql.DB) IOrderRepository {
	return &OrderRepository{db: db}
}

// CreateOrder: Tạo đơn hàng
func (r *OrderRepository) CreateOrder(ctx context.Context, order *model.Order, items []model.OrderItem, address *model.OrderAddress, initialPayment *model.OrderPayment) error {
	logger.DebugLogger.Printf("Starting CreateOrder for UserID: %d, TotalAmount: %.2f", order.UserID, order.TotalAmount)
	// Bắt đầu Transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		logger.ErrorLogger.Printf("CreateOrder: Failed to begin transaction: %v", err)
		return err
	}

	defer tx.Rollback()

	//  Insert vào bảng ORDERS
	queryOrder := `
		INSERT INTO orders (order_number, user_id, status, total_amount, payment_status, note, placed_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?)`

	res, err := tx.ExecContext(ctx, queryOrder,
		order.OrderNumber, order.UserID, order.Status, order.TotalAmount,
		order.PaymentStatus, order.Note, order.PlacedAt,
	)
	if err != nil {
		logger.ErrorLogger.Printf("CreateOrder: Insert Orders failed: %v", err)
		return fmt.Errorf("failed to insert order: %v", err)
	}

	// Lấy ID đơn hàng vừa tạo
	orderID, err := res.LastInsertId()
	if err != nil {
		logger.ErrorLogger.Printf("CreateOrder: Get LastInsertId failed: %v", err)
		return err
	}
	order.ID = orderID

	//  Insert vào bảng ORDER_ITEMS
	queryItem := `
		INSERT INTO order_items (order_id, product_id, variant_id, sku, title, option_values, unit_price, quantity, line_subtotal)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	stmtItem, err := tx.PrepareContext(ctx, queryItem) // Prepare statement cho tối ưu vì loop nhiều lần

	if err != nil {
		logger.ErrorLogger.Printf("CreateOrder: Prepare stmtItem failed: %v", err)
		return err
	}
	defer stmtItem.Close()

	for _, item := range items {
		_, err := stmtItem.ExecContext(ctx,
			orderID, item.ProductID, item.VariantID, item.SKU, item.Title,
			item.OptionValues, item.UnitPrice, item.Quantity, item.LineSubtotal,
		)
		if err != nil {
			logger.ErrorLogger.Printf("CreateOrder: Insert Item (ProductID: %d) failed: %v", item.ProductID, err)
			return fmt.Errorf("failed to insert order item: %v", err)
		}
	}

	//  Insert vào bảng ORDER_ADDRESSES 
	queryAddress := `
		INSERT INTO order_addresses (order_id, type, recipient_name, phone, line1, line2, city, state, country)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err = tx.ExecContext(ctx, queryAddress,
		orderID, address.Type, address.RecipientName, address.Phone,
		address.Line1, address.Line2, address.City, address.State, address.Country,
	)
	if err != nil {
		logger.ErrorLogger.Printf("CreateOrder: Insert Address failed: %v", err)
		return fmt.Errorf("failed to insert order address: %v", err)
	}

	// Insert vào bảng ORDER_PAYMENTS
	if initialPayment != nil {
		queryPayment := `
			INSERT INTO order_payments (order_id, method, amount, status)
			VALUES (?, ?, ?, ?)`
		resPay, err := tx.ExecContext(ctx, queryPayment, orderID, initialPayment.Method, initialPayment.Amount, initialPayment.Status)
		if err != nil {
			logger.ErrorLogger.Printf("CreateOrder: Insert Payment failed: %v", err)
			return fmt.Errorf("failed to insert order payment: %v", err)
		}

		payID, err := resPay.LastInsertId()
		if err == nil {
			initialPayment.ID = payID // Gán ngược lại ID thanh toán
		}
	}

	// Chốt Transaction
	if err = tx.Commit(); err != nil {
		logger.ErrorLogger.Printf("CreateOrder: Commit transaction failed: %v", err)
		return err
	}
	logger.InfoLogger.Printf("CreateOrder success. New OrderID: %d | OrderNumber: %s", orderID, order.OrderNumber)
	return nil
}

// UpdateOrderStatus: Cập nhật trạng thái + Ghi log
func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID int64, newStatus string, note string, changedBy *int64) error {
	logger.DebugLogger.Printf("Starting UpdateOrderStatus. OrderID: %d, NewStatus: %s", orderID, newStatus)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		logger.ErrorLogger.Printf("UpdateOrderStatus: BeginTx failed: %v", err)
		return err
	}
	defer tx.Rollback()

	// Lấy trạng thái cũ để lưu log
	var oldStatus string
	err = tx.QueryRowContext(ctx, "SELECT status FROM orders WHERE id = ?", orderID).Scan(&oldStatus)
	if err != nil {
		logger.ErrorLogger.Printf("UpdateOrderStatus: Get old status failed: %v", err)
		return err
	}

	queryUpdate := "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?"
	args := []interface{}{newStatus, orderID}

	// Nếu trạng thái là 'completed' -> Cập nhật thêm completed_at
	if newStatus == model.OrderStatusCompleted {
		queryUpdate = "UPDATE orders SET status = ?, updated_at = NOW(), completed_at = NOW() WHERE id = ?"
		args = []interface{}{newStatus, orderID}
	}

	//  Nếu trạng thái là 'cancelled' -> Cập nhật thêm cancelled_at
	if newStatus == model.OrderStatusCancelled {
		queryUpdate = "UPDATE orders SET status = ?, updated_at = NOW(), cancelled_at = NOW() WHERE id = ?"
	}

	_, err = tx.ExecContext(ctx, queryUpdate, args...)
	if err != nil {
		logger.ErrorLogger.Printf("UpdateOrderStatus: Update orders table failed: %v", err)
		return err
	}

	//  Insert bảng ORDER_STATUS_HISTORY
	queryHistory := `
		INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
		VALUES (?, ?, ?, ?, ?)`

	_, err = tx.ExecContext(ctx, queryHistory, orderID, oldStatus, newStatus, changedBy, note)
	if err != nil {
		logger.ErrorLogger.Printf("UpdateOrderStatus: Insert history failed: %v", err)
		return err
	}

	return tx.Commit()
}


// xác nhận thanh toán
func (r *OrderRepository) ConfirmPayment(ctx context.Context, orderID int64, payment *model.OrderPayment) error {
    logger.InfoLogger.Printf("Repo: Starting ConfirmPayment Transaction for OrderID: %d", orderID)

    // Bắt đầu Transaction
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
   
    defer tx.Rollback() 

	var queryUpdateOrder string
    var newOrderPaymentStatus string

    if payment.Status == "completed" {
        newOrderPaymentStatus = model.PaymentStatusPaid
        queryUpdateOrder = `
            UPDATE orders 
            SET payment_status = ?, updated_at = NOW(), paid_at = NOW() 
            WHERE id = ?`

	} else if payment.Status == "refunded" {
        newOrderPaymentStatus = model.PaymentStatusRefunded
        queryUpdateOrder = `
            UPDATE orders 
            SET payment_status = ?, updated_at = NOW() 
            WHERE id = ?`
    } else {
        newOrderPaymentStatus = model.PaymentStatusUnpaid
        queryUpdateOrder = `
            UPDATE orders 
            SET payment_status = ?, updated_at = NOW() 
            WHERE id = ?`
    }
    
    _, err = tx.ExecContext(ctx, queryUpdateOrder, newOrderPaymentStatus, orderID)
    if err != nil {
        logger.ErrorLogger.Printf("ConfirmPayment: Update Orders failed: %v", err)
        return err
    }

    
    queryInsertPayment := `
        INSERT INTO order_payments (order_id, method, amount, status, paid_at) 
        VALUES (?, ?, ?, ?, ?)`
    
    _, err = tx.ExecContext(ctx, queryInsertPayment, 
        payment.OrderID, payment.Method, payment.Amount, payment.Status, payment.PaidAt,
    )
    if err != nil {
        logger.ErrorLogger.Printf("ConfirmPayment: Insert OrderPayments failed: %v", err)
        return err
    }

    
    if err := tx.Commit(); err != nil {
        logger.ErrorLogger.Printf("ConfirmPayment: Commit failed: %v", err)
        return err
    }

    logger.InfoLogger.Printf("ConfirmPayment Transaction Success for OrderID: %d", orderID)
    return nil
}

//  Lấy thông tin cơ bản
func (r *OrderRepository) GetOrderByID(ctx context.Context, id int64) (*model.Order, error) {
	logger.DebugLogger.Printf("Starting GetOrderByID: %d", id)
	query := `
		SELECT id, order_number, user_id, status, total_amount, payment_status, note, 
		       placed_at, created_at, updated_at, paid_at, completed_at, cancelled_at
		FROM orders WHERE id = ?`

	var o model.Order
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&o.ID, &o.OrderNumber, &o.UserID, &o.Status, &o.TotalAmount, &o.PaymentStatus, &o.Note,
		&o.PlacedAt, &o.CreatedAt, &o.UpdatedAt,
		&o.PaidAt, &o.CompletedAt, &o.CancelledAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			logger.WarnLogger.Printf("GetOrderByID: Order not found (ID: %d)", id)
			return nil, err
		}
		logger.ErrorLogger.Printf("GetOrderByID failed: %v", err)
		return nil, err
	}
	logger.InfoLogger.Printf("GetOrderByID success (ID: %d)", id)
	return &o, nil
}

//  Tìm theo mã đơn hàng
func (r *OrderRepository) GetByOrderNumber(ctx context.Context, orderNumber string) (*model.Order, error) {
	logger.DebugLogger.Printf("Starting GetByOrderNumber: %s", orderNumber)
	query := `
		SELECT id, order_number, user_id, status, total_amount, payment_status, note, 
		       placed_at, created_at, updated_at, paid_at, completed_at, cancelled_at
		FROM orders WHERE order_number = ?`

	var o model.Order
	err := r.db.QueryRowContext(ctx, query, orderNumber).Scan(
		&o.ID, &o.OrderNumber, &o.UserID, &o.Status, &o.TotalAmount, &o.PaymentStatus, &o.Note,
		&o.PlacedAt, &o.CreatedAt, &o.UpdatedAt,
		&o.PaidAt, &o.CompletedAt, &o.CancelledAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			logger.WarnLogger.Printf("GetByOrderNumber: Order not found (%s)", orderNumber)
			return nil, err
		}
		logger.ErrorLogger.Printf("GetByOrderNumber failed: %v", err)
		return nil, err
	}
	logger.InfoLogger.Printf("GetByOrderNumber success found ID: %d", o.ID)
	return &o, nil
}

//  Lọc và Phân trang 
func (r *OrderRepository) GetOrders(ctx context.Context, filter model.OrderFilter) ([]model.Order, int, error) {
	logger.DebugLogger.Printf("Starting GetOrders with Filter: %+v", filter)
	
	whereClauses := []string{"1=1"}
	args := []interface{}{}

	if filter.UserID > 0 {
		whereClauses = append(whereClauses, "user_id = ?")
		args = append(args, filter.UserID)
	}
	if filter.Status != "" {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, filter.Status)
	}
	if filter.PaymentStatus != "" {
		whereClauses = append(whereClauses, "payment_status = ?")
		args = append(args, filter.PaymentStatus)
	}
	if filter.OrderID != "" { 
		whereClauses = append(whereClauses, "order_number LIKE ?")
		args = append(args, "%"+filter.OrderID+"%")
	}
	// Lọc theo ngày đặt hàng
	if filter.StartDate != "" {
		whereClauses = append(whereClauses, "placed_at >= ?")
		args = append(args, filter.StartDate) // Format YYYY-MM-DD
	}
	if filter.EndDate != "" {
		whereClauses = append(whereClauses, "placed_at <= ?")
		args = append(args, filter.EndDate+" 23:59:59") // Lấy hết ngày cuối
	}

	if filter.Keyword != "" {
		searchCondition := `(
			order_number LIKE ? 
			OR EXISTS (
				SELECT 1 FROM order_items 
				WHERE order_items.order_id = orders.id 
				AND order_items.title LIKE ?
			)
		)`
		whereClauses = append(whereClauses, searchCondition)
		
		kw := "%" + filter.Keyword + "%"
		args = append(args, kw, kw) 
	}

	whereQuery := strings.Join(whereClauses, " AND ")

	//  Đếm tổng số lượng cho phân trang
	countQuery := "SELECT COUNT(*) FROM orders WHERE " + whereQuery
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		logger.ErrorLogger.Printf("GetOrders: Count failed. Query: %s, Error: %v", countQuery, err)
		return nil, 0, err
	}

	//  Query dữ liệu chính
	// Tính Offset
	limit := filter.Limit
	offset := (filter.Page - 1) * limit

	dataQuery := fmt.Sprintf(`
		SELECT id, order_number, user_id, status, total_amount, payment_status, 
		       placed_at, created_at, paid_at, completed_at, cancelled_at
		FROM orders
		WHERE %s 
		ORDER BY placed_at DESC 
		LIMIT ? OFFSET ?`, whereQuery)

	// Thêm tham số limit, offset vào args
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		logger.ErrorLogger.Printf("GetOrders: Query failed: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var o model.Order
		if err := rows.Scan(&o.ID, &o.OrderNumber, &o.UserID, &o.Status, &o.TotalAmount, &o.PaymentStatus, &o.PlacedAt, &o.CreatedAt,&o.PaidAt, &o.CompletedAt, &o.CancelledAt,); err != nil {
			logger.ErrorLogger.Printf("GetOrders: Scan row failed: %v", err)
			return nil, 0, err
		}
		orders = append(orders, o)
	}
	logger.InfoLogger.Printf("GetOrders success. Retrieved %d/%d orders", len(orders), total)
	return orders, total, nil
}

// Lấy thông tin sản phẩm trong đơn hàng
func (r *OrderRepository) GetOrderItems(ctx context.Context, orderID int64) ([]model.OrderItem, error) {
	logger.DebugLogger.Printf("Starting GetOrderItems for OrderID: %d", orderID)
	query := `
		SELECT id, order_id, product_id, variant_id, sku, title, option_values, unit_price, quantity, line_subtotal
		FROM order_items WHERE order_id = ?`

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("GetOrderItems failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var items []model.OrderItem
	for rows.Next() {
		var i model.OrderItem
		if err := rows.Scan(&i.ID, &i.OrderID, &i.ProductID, &i.VariantID, &i.SKU, &i.Title, &i.OptionValues, &i.UnitPrice, &i.Quantity, &i.LineSubtotal); err != nil {
			logger.ErrorLogger.Printf("GetOrderItems Scan failed: %v", err)
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// Lấy thông tin địa chỉ trong đơn hàng
func (r *OrderRepository) GetOrderAddress(ctx context.Context, orderID int64) (*model.OrderAddress, error) {
	logger.DebugLogger.Printf("Starting GetOrderAddress for OrderID: %d", orderID)
	query := `
		SELECT id, order_id, type, recipient_name, phone, line1, 
		       COALESCE(line2, ''), city, COALESCE(state, ''), country
		FROM order_addresses WHERE order_id = ?`

	var a model.OrderAddress
	err := r.db.QueryRowContext(ctx, query, orderID).Scan(
		&a.ID, &a.OrderID, &a.Type, &a.RecipientName, &a.Phone,
		&a.Line1, &a.Line2, &a.City, &a.State, &a.Country,
	)
	if err == sql.ErrNoRows {
		logger.WarnLogger.Printf("GetOrderAddress: No address found for OrderID: %d", orderID)
		return nil, nil 
	}
	if err != nil {
		logger.ErrorLogger.Printf("GetOrderAddress failed: %v", err)
		return nil, err
	}
	return &a, nil
}

// Lấy dữ liệu log lịch sử trạng thái thanh toán
func (r *OrderRepository) GetOrderPayments(ctx context.Context, orderID int64) ([]model.OrderPayment, error) {
	logger.DebugLogger.Printf("Starting GetOrderPayments for OrderID: %d", orderID)
	query := `SELECT id, method, amount, status, paid_at, created_at FROM order_payments WHERE order_id = ?`
	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("GetOrderPayments failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var payments []model.OrderPayment
	for rows.Next() {
		var p model.OrderPayment
		if err := rows.Scan(&p.ID, &p.Method, &p.Amount, &p.Status, &p.PaidAt, &p.CreatedAt); err != nil {
			logger.ErrorLogger.Printf("GetOrderPayments Scan failed: %v", err)
			return nil, err
		}
		payments = append(payments, p)
	}
	return payments, nil
}

// Lấy dữ liệu log lịch sử cập nhật trạng thái đơn hàng
func (r *OrderRepository) GetOrderStatusHistory(ctx context.Context, orderID int64) ([]model.OrderStatusHistory, error) {
	logger.DebugLogger.Printf("Starting GetOrderStatusHistory for OrderID: %d", orderID)
	query := `
		SELECT id, from_status, to_status, changed_by, COALESCE(note, ''), created_at 
		FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("GetOrderStatusHistory failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var histories []model.OrderStatusHistory
	for rows.Next() {
		var h model.OrderStatusHistory
		// Xử lý scan
		if err := rows.Scan(&h.ID, &h.FromStatus, &h.ToStatus, &h.ChangedBy, &h.Note, &h.CreatedAt); err != nil {
			logger.ErrorLogger.Printf("GetOrderStatusHistory Scan failed: %v", err)
			return nil, err
		}
		histories = append(histories, h)
	}
	return histories, nil
}

// HasUserPurchasedProduct: Kiểm tra xem user đã mua sản phẩm và đơn hàng đã hoàn thành chưa
func (r *OrderRepository) HasUserPurchasedProduct(ctx context.Context, userID int64, productID int64) (bool, error) {
	query := `
		SELECT 1 
		FROM orders o
		JOIN order_items oi ON o.id = oi.order_id
		WHERE o.user_id = ? 
		AND oi.product_id = ? 
		AND o.status = 'completed'
		LIMIT 1`

	var exists int
	err := r.db.QueryRowContext(ctx, query, userID, productID).Scan(&exists)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil // Chưa mua hoặc chưa hoàn thành
		}
		logger.ErrorLogger.Printf("HasUserPurchasedProduct error: %v", err)
		return false, err
	}

	return true, nil // Đã mua và đơn đã hoàn thành
}