package cart

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"golang/internal/logger"
	"golang/internal/model"
)

type cartRepository struct {
	db *sql.DB
}

func NewCartRepository(db *sql.DB) ICartRepository {
	return &cartRepository{db: db}
}

// Lấy CartID dựa trên UserID
func (r *cartRepository) GetCartIDByUserID(ctx context.Context, userID int64) (int64, error) {
	logger.DebugLogger.Printf("Repo: Getting CartID for UserID: %d", userID)

	var id int64
	query := `SELECT id FROM carts WHERE user_id = ? LIMIT 1`

	err := r.db.QueryRowContext(ctx, query, userID).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			logger.ErrorLogger.Printf("Repo: No cart found for UserID: %d", userID)
			return 0, nil
		}
		logger.ErrorLogger.Printf("Repo: Error getting cart ID: %v", err)
		return 0, err
	}

	return id, nil
}

// Tạo giỏ hàng mới
func (r *cartRepository) CreateCart(ctx context.Context, userID int64) (int64, error) {
	logger.DebugLogger.Printf("Repo: Creating new cart for UserID: %d", userID)

	query := `INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`

	res, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Failed to create cart: %v", err)
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Failed to get last insert ID: %v", err)
		return 0, err
	}

	logger.InfoLogger.Printf("Repo: Cart created successfully with ID: %d", id)
	return id, nil
}

// Lấy danh sách items với JOIN để tránh N+1 Query
func (r *cartRepository) GetCartItems(ctx context.Context, cartID int64) ([]model.CartItem, error) {
	logger.DebugLogger.Printf("Repo: Getting items for CartID: %d", cartID)

	var items []model.CartItem
	query := `
		SELECT id, cart_id, product_id, variant_id, quantity, created_at, updated_at 
		FROM cart_items 
		WHERE cart_id = ?
		ORDER BY created_at DESC
	`

	// Dùng QueryContext cho truy vấn trả về nhiều dòng
	rows, err := r.db.QueryContext(ctx, query, cartID)
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Error query cart items: %v", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var i model.CartItem
		err := rows.Scan(
			&i.ID,
			&i.CartID,
			&i.ProductID,
			&i.VariantID,
			&i.Quantity,
			&i.CreatedAt,
			&i.UpdatedAt,
		)
		if err != nil {
			logger.ErrorLogger.Printf("Repo: Error scanning row: %v", err)
			return nil, err
		}
		items = append(items, i)
	}

	// Kiểm tra lỗi sau khi loop
	if err = rows.Err(); err != nil {
		logger.ErrorLogger.Printf("Repo: Error iterating rows: %v", err)
		return nil, err
	}

	return items, nil
}

// GetCartItemsWithDetails - Lấy cart items với thông tin Product và Variant (JOIN để tránh N+1)
func (r *cartRepository) GetCartItemsWithDetails(ctx context.Context, cartID int64) ([]model.CartItemResponse, error) {
	logger.DebugLogger.Printf("Repo: Getting cart items with details for CartID: %d", cartID)

	query := `
		SELECT 
			ci.id as item_id,
			ci.product_id,
			p.name as product_name,
			ci.variant_id,
			COALESCE(pv.title, pv.sku) as variant_name,
			COALESCE(pv.price_override, p.min_price) as price,
			ci.quantity,
			pv.stock_quantity,
			CASE WHEN pv.thumbnail_url IS NULL OR pv.thumbnail_url = '' THEN p.thumbnail_url ELSE pv.thumbnail_url END as thumbnail_url,
			CASE WHEN p.deleted_at IS NOT NULL OR p.status = 'archived' THEN true ELSE false END as is_deleted
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		JOIN product_variants pv ON ci.variant_id = pv.id
		WHERE ci.cart_id = ?
		ORDER BY ci.created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, cartID)
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Error query cart items with details: %v", err)
		return nil, err
	}
	defer rows.Close()

	var items []model.CartItemResponse
	for rows.Next() {
		var item model.CartItemResponse
		var stockQuantity int
		var thumbURL sql.NullString

		err := rows.Scan(
			&item.ItemID,
			&item.ProductID,
			&item.ProductName,
			&item.VariantID,
			&item.VariantName,
			&item.Price,
			&item.Quantity,
			&stockQuantity,
			&thumbURL,
			&item.IsDeleted,
		)
		if err != nil {
			logger.ErrorLogger.Printf("Repo: Error scanning row: %v", err)
			return nil, err
		}

		item.ThumbnailURL = thumbURL.String

		// Tính toán các giá trị
		item.SubTotal = item.Price * float64(item.Quantity)
		item.StockCheck = item.Quantity <= stockQuantity
		item.StockQuantity = stockQuantity

		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		logger.ErrorLogger.Printf("Repo: Error iterating rows: %v", err)
		return nil, err
	}

	logger.InfoLogger.Printf("Repo: Found %d cart items for CartID: %d", len(items), cartID)
	return items, nil
}

// Thêm hoặc Cộng dồn số lượng (user bấm thêm vào giỏ ở trang chi tiết sản phẩm)
func (r *cartRepository) UpsertCartItem(ctx context.Context, cartID int64, req model.AddToCartRequest) error {
	logger.DebugLogger.Printf("Repo: Upserting item for CartID: %d, VariantID: %d", cartID, req.VariantID)

	// Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
	var existingQuantity int
	checkQuery := `SELECT quantity FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1`
	err := r.db.QueryRowContext(ctx, checkQuery, cartID, req.VariantID).Scan(&existingQuantity)

	if err == nil {
		// Đã tồn tại -> Cập nhật số lượng
		updateQuery := `UPDATE cart_items SET quantity = quantity + ?, updated_at = NOW() WHERE cart_id = ? AND variant_id = ?`
		_, err = r.db.ExecContext(ctx, updateQuery, req.Quantity, cartID, req.VariantID)
		if err != nil {
			logger.ErrorLogger.Printf("Repo: Failed to update existing cart item: %v", err)
			return err
		}
	} else if err == sql.ErrNoRows {
		// Chưa tồn tại -> Thêm mới
		insertQuery := `
			INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, created_at, updated_at)
			VALUES (?, ?, ?, ?, NOW(), NOW())
		`
		_, err = r.db.ExecContext(ctx, insertQuery, cartID, req.ProductID, req.VariantID, req.Quantity)
		if err != nil {
			logger.ErrorLogger.Printf("Repo: Failed to insert new cart item: %v", err)
			return err
		}
	} else {
		logger.ErrorLogger.Printf("Repo: Error checking existing cart item: %v", err)
		return err
	}

	return nil
}

// Cập nhật số lượng cụ thể (user chỉnh sửa số lượng sản phẩm trong giỏ hàng)
func (r *cartRepository) UpdateItemQuantity(ctx context.Context, cartID int64, variantID int64, quantity int) error {
	logger.DebugLogger.Printf("Repo: Updating quantity CartID: %d, VariantID: %d -> %d", cartID, variantID, quantity)

	query := `
		UPDATE cart_items 
		SET quantity = ?, updated_at = NOW() 
		WHERE cart_id = ? AND variant_id = ?
	`
	_, err := r.db.ExecContext(ctx, query, quantity, cartID, variantID)
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Failed to update quantity: %v", err)
		return err
	}
	return nil
}

// Xóa 1 hoặc nhiều sản phẩm
func (r *cartRepository) RemoveItems(ctx context.Context, cartID int64, variantIDs []int64) error {
	if len(variantIDs) == 0 {
		return nil
	}
	logger.DebugLogger.Printf("Repo: Removing items for CartID: %d, VariantIDs: %v", cartID, variantIDs)

	// Xử lý tạo chuỗi query động: DELETE ... IN (?, ?, ?)
	// Vì database/sql không hỗ trợ truyền slice vào IN trực tiếp như sqlx
	placeholders := make([]string, len(variantIDs))
	args := make([]interface{}, len(variantIDs)+1)

	args[0] = cartID // Tham số đầu tiên là cart_id

	for i, id := range variantIDs {
		placeholders[i] = "?"
		args[i+1] = id // Các tham số tiếp theo là variant_id
	}

	// Ghép chuỗi: "DELETE ... WHERE cart_id = ? AND variant_id IN (?,?,?)"
	query := fmt.Sprintf(
		"DELETE FROM cart_items WHERE cart_id = ? AND variant_id IN (%s)",
		strings.Join(placeholders, ","),
	)

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Failed to remove items: %v", err)
		return err
	}

	return nil
}

// Đếm số loại sản phẩm
func (r *cartRepository) CountCartItems(ctx context.Context, cartID int64) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM cart_items WHERE cart_id = ?`

	err := r.db.QueryRowContext(ctx, query, cartID).Scan(&count)
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Failed to count items: %v", err)
		return 0, err
	}
	return count, nil
}
