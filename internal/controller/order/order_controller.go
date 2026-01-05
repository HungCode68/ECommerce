package order

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/repository/address"
	repository "golang/internal/repository/order"
	"golang/internal/repository/product"
	"golang/internal/repository/productvariant"
	"golang/internal/utils"
)

type orderController struct {
	OrderRepo          repository.IOrderRepository
	ProductRepo        product.ProductRepository
	ProductVariantRepo productvariant.ProductVariantsRepository
	AddressRepo        address.AddressRepo
}

func NewOrderController(
	orderRepo repository.IOrderRepository,
	productRepo product.ProductRepository,
	variantRepo productvariant.ProductVariantsRepository,
	addrRepo address.AddressRepo,
) OrderController {
	return &orderController{
		OrderRepo:          orderRepo,
		ProductRepo:        productRepo,
		ProductVariantRepo: variantRepo,
		AddressRepo:        addrRepo,
	}
}

// Xử lý logic đặt hàng
func (c *orderController) CreateOrder(ctx context.Context, userID int64, req model.CreateOrderRequest) (*model.OrderResponse, error) {
	logger.InfoLogger.Printf("User %d creating new order", userID)

	// Gọi Address Repo để lấy thông tin chi tiết từ ID user gửi lên
	realAddress, err := c.AddressRepo.GetAddressByID(req.AddressID, userID)
	if err != nil {
		logger.ErrorLogger.Printf("Order failed: Address ID %d not found for user %d", req.AddressID, userID)
		return nil, errors.New("địa chỉ giao hàng không hợp lệ hoặc không tồn tại")
	}

	// Tạo Snapshot Address từ dữ liệu thật trong DB
	addressSnapshot := &model.OrderAddress{
		Type:          model.OrderAddressTypeShipping,
		RecipientName: realAddress.RecipientName,
		Phone:         realAddress.Phone,
		Line1:         realAddress.Line1,
		Line2:         realAddress.Line2,
		City:          realAddress.City,
		State:         realAddress.State,
		Country:       realAddress.Country,
	}

	var orderItems []model.OrderItem
	var totalAmount float64 = 0

	for _, reqItem := range req.Items {
		//  lấy thông tin sản phẩm gốc trước để check trạng thái
		parentProduct, err := c.ProductRepo.GetProductByID(reqItem.ProductID)
		if err != nil || parentProduct == nil {
			logger.ErrorLogger.Printf("CreateOrder: Product not found (ID: %d)", reqItem.ProductID)
			return nil, fmt.Errorf("sản phẩm ID %d không tồn tại", reqItem.ProductID)
		}

		// Check xem sản phẩm có đang được bán không
		if !parentProduct.IsPublished {
			logger.WarnLogger.Printf("CreateOrder: Product unpublished (ID: %d)", reqItem.ProductID)
			return nil, fmt.Errorf("sản phẩm '%s' hiện đang ngừng kinh doanh", parentProduct.Name)
		}

		if reqItem.VariantID == 0 {
			return nil, fmt.Errorf("sản phẩm '%s' bắt buộc phải chọn phân loại hàng", parentProduct.Name)
		}

		//  Lấy thông tin Variant từ DB
		variant, err := c.ProductVariantRepo.GetVariantByID(reqItem.VariantID)
		if err != nil || variant == nil {
			logger.ErrorLogger.Printf("CreateOrder: Variant not found (ID: %d)", reqItem.VariantID)
			return nil, fmt.Errorf("biến thể ID %d không tồn tại", reqItem.VariantID)
		}

		//  Variant phải thuộc về ProductID gửi lên
		if variant.ProductID != reqItem.ProductID {
			return nil, fmt.Errorf("biến thể '%s' không thuộc sản phẩm '%s'", *variant.Title, parentProduct.Name)
		}

		//  Kiểm tra tồn kho
		if variant.StockQuantity < reqItem.Quantity {
			logger.WarnLogger.Printf("CreateOrder: Out of stock (VariantID: %d, Req: %d, Stock: %d)", reqItem.VariantID, reqItem.Quantity, variant.StockQuantity)
			return nil, fmt.Errorf("sản phẩm '%s' (Phân loại: %s) không đủ hàng. Còn: %d", parentProduct.Name, *variant.Title, variant.StockQuantity)
		}

		// Tính toán giá & Tên hiển thị
		var finalPrice float64

		// Ưu tiên lấy giá đè của Variant, nếu không có thì lấy MinPrice của Product
		if variant.PriceOverride != nil {
			finalPrice = *variant.PriceOverride
		} else {
			finalPrice = parentProduct.MinPrice
		}

		// Tên hiển thị (VD: Áo Thun - Màu Đỏ)
		variantTitle := ""
		if variant.Title != nil {
			variantTitle = " - " + *variant.Title
		}
		finalTitle := parentProduct.Name + variantTitle

		//  Tính tổng tiền
		lineSubtotal := finalPrice * float64(reqItem.Quantity)
		totalAmount += lineSubtotal

		//  Tạo Snapshot Item để lưu DB
		variantIDVal := reqItem.VariantID

		item := model.OrderItem{
			ProductID:    reqItem.ProductID,
			VariantID:    &variantIDVal,
			Quantity:     reqItem.Quantity,
			UnitPrice:    finalPrice,
			LineSubtotal: lineSubtotal,
			Title:        finalTitle,
			SKU:          variant.SKU,
			OptionValues: variant.OptionValues,
		}

		orderItems = append(orderItems, item)
	}

	orderNumber := fmt.Sprintf("ORD-%d", time.Now().UnixNano())

	newOrder := &model.Order{
		OrderNumber:   orderNumber,
		UserID:        userID,
		Status:        model.OrderStatusPending,
		PaymentStatus: model.PaymentStatusUnpaid,
		TotalAmount:   totalAmount,
		Note:          &req.Note,
		PlacedAt:      time.Now(),
	}

	// Tạo Payment
	initialPayment := &model.OrderPayment{
		Method: req.PaymentMethod,
		Amount: totalAmount,
		Status: model.PaymentTransStatusPending,
	}

	err = c.OrderRepo.CreateOrder(ctx, newOrder, orderItems, addressSnapshot, initialPayment)
	if err != nil {
		logger.ErrorLogger.Printf("CreateOrder failed for user %d: %v", userID, err)
		return nil, err
	}

	// Trả về kết quả
	return &model.OrderResponse{
		ID:            newOrder.ID,
		OrderNumber:   newOrder.OrderNumber,
		Status:        newOrder.Status,
		TotalAmount:   utils.FormatVND(newOrder.TotalAmount),
		PaymentStatus: newOrder.PaymentStatus,
		Note:          req.Note,
		Payments: []model.OrderPaymentResponse{
			{
				ID:     initialPayment.ID,
				Method: req.PaymentMethod,
				Amount: utils.FormatVND(totalAmount),
				Status: model.PaymentTransStatusPending,
			},
		},
		PlacedAt: newOrder.PlacedAt,
	}, nil
}

// Xem chi tiết đơn hàng của tôi
func (c *orderController) GetMyOrder(ctx context.Context, userID int64, orderID int64) (*model.OrderResponse, error) {
	logger.DebugLogger.Printf("Starting GetMyOrder. UserID: %d, OrderID: %d", userID, orderID)
	//  Lấy thông tin cơ bản
	order, err := c.OrderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("GetMyOrder: Order not found or DB error. ID: %d. Error: %v", orderID, err)
		return nil, err
	}

	if order.UserID != userID {
		logger.WarnLogger.Printf("User %d tried to access order %d of another user", userID, orderID)
		return nil, errors.New("bạn không có quyền xem đơn hàng này")
	}

	//  Lấy các thông tin
	items, _ := c.OrderRepo.GetOrderItems(ctx, orderID)
	address, _ := c.OrderRepo.GetOrderAddress(ctx, orderID)
	payments, _ := c.OrderRepo.GetOrderPayments(ctx, orderID)

	var itemRes []model.OrderItemResponse
	for _, i := range items {
		itemRes = append(itemRes, mapToItemResponse(i))
	}

	var payRes []model.OrderPaymentResponse
	for _, p := range payments {
		payRes = append(payRes, model.OrderPaymentResponse{
			ID: p.ID, Method: p.Method, Amount: utils.FormatVND(p.Amount), Status: p.Status, PaidAt: p.PaidAt, CreatedAt: p.CreatedAt,
		})
	}

	noteStr := ""
	if order.Note != nil {
		noteStr = *order.Note
	}
	logger.InfoLogger.Printf("GetMyOrder success for UserID: %d", userID)
	return &model.OrderResponse{
		ID:              order.ID,
		OrderNumber:     order.OrderNumber,
		Status:          order.Status,
		TotalAmount:     utils.FormatVND(order.TotalAmount),
		PaymentStatus:   order.PaymentStatus,
		Note:            noteStr,
		ShippingAddress: address,
		Items:           itemRes,
		Payments:        payRes,
		PlacedAt:        order.PlacedAt,
		UpdatedAt:       order.UpdatedAt,
		PaidAt:          order.PaidAt,
		CompletedAt:     order.CompletedAt,
		CancelledAt:     order.CancelledAt,
	}, nil
}

// Lấy danh sách đơn hàng của tôi
func (c *orderController) GetMyListOrders(ctx context.Context, userID int64, filter model.OrderFilter) ([]model.OrderResponse, int, error) {
	logger.DebugLogger.Printf("Starting GetMyOrders for UserID: %d | Page: %d", userID, filter.Page)
	// Gán cứng UserID vào filter để lấy danh sách đơn hàng
	filter.UserID = userID

	orders, total, err := c.OrderRepo.GetOrders(ctx, filter)
	if err != nil {
		logger.ErrorLogger.Printf("GetMyOrders failed for UserID: %d. Error: %v", userID, err)
		return nil, 0, err
	}

	// Map sang Response
	var response []model.OrderResponse
	for _, o := range orders {
		noteStr := ""
		if o.Note != nil {
			noteStr = *o.Note
		}

		response = append(response, model.OrderResponse{
			ID:            o.ID,
			OrderNumber:   o.OrderNumber,
			Status:        o.Status,
			TotalAmount:   utils.FormatVND(o.TotalAmount),
			PaymentStatus: o.PaymentStatus,
			Note:          noteStr,
			PlacedAt:      o.PlacedAt,
			UpdatedAt:     o.UpdatedAt,
			PaidAt:        o.PaidAt,
			CompletedAt:   o.CompletedAt,
			CancelledAt:   o.CancelledAt,
		})
	}
	logger.InfoLogger.Printf("GetMyOrders success. UserID: %d. Found: %d", userID, total)
	return response, total, nil
}

// User hủy đơn
func (c *orderController) CancelOrder(ctx context.Context, userID int64, orderID int64, reason string) error {
	logger.InfoLogger.Printf("Starting CancelOrder. UserID: %d, OrderID: %d", userID, orderID)
	order, err := c.OrderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("CancelOrder: GetOrder failed. Error: %v", err)
		return err
	}

	if order.UserID != userID {
		logger.WarnLogger.Printf("CancelOrder: Unauthorized access. UserID: %d, OrderID: %d", userID, orderID)
		return errors.New("không có quyền thao tác")
	}

	// Check trạng thái: Chỉ được hủy khi đang Pending
	if order.Status != model.OrderStatusPending {
		logger.WarnLogger.Printf("CancelOrder: Invalid status '%s' for OrderID: %d", order.Status, orderID)
		return errors.New("đơn hàng đã được xử lý, không thể hủy")
	}

	// Gọi Repo update
	fullReason := fmt.Sprintf("Khách hủy: %s", reason)
	userIDPtr := &userID

	err = c.OrderRepo.UpdateOrderStatus(ctx, orderID, model.OrderStatusCancelled, fullReason, userIDPtr)
	if err != nil {
		logger.ErrorLogger.Printf("CancelOrder: UpdateStatus failed. Error: %v", err)
		return err
	}

	logger.InfoLogger.Printf("CancelOrder success. OrderID: %d", orderID)
	return nil
}

// Admin xem chi tiết đơn hàng
func (c *orderController) GetAdminOrderDetail(ctx context.Context, orderID int64) (*model.AdminOrderResponse, error) {
	logger.DebugLogger.Printf("Starting GetAdminOrderDetail. OrderID: %d", orderID)
	// Lấy thông tin
	order, err := c.OrderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("GetAdminOrderDetail failed. Error: %v", err)
		return nil, err
	}

	//  Lấy Full thông tin
	items, _ := c.OrderRepo.GetOrderItems(ctx, orderID)
	address, _ := c.OrderRepo.GetOrderAddress(ctx, orderID)
	payments, _ := c.OrderRepo.GetOrderPayments(ctx, orderID)
	histories, _ := c.OrderRepo.GetOrderStatusHistory(ctx, orderID)

	var itemRes []model.OrderItemResponse
	for _, i := range items {
		itemRes = append(itemRes, mapToItemResponse(i))
	}

	var payRes []model.OrderPaymentResponse
	for _, p := range payments {
		payRes = append(payRes, model.OrderPaymentResponse{
			ID: p.ID, Method: p.Method, Amount: utils.FormatVND(p.Amount), Status: p.Status, PaidAt: p.PaidAt, CreatedAt: p.CreatedAt,
		})
	}

	var histRes []model.OrderStatusHistoryResponse
	for _, h := range histories {
		histRes = append(histRes, model.OrderStatusHistoryResponse{
			ID: h.ID, FromStatus: h.FromStatus, ToStatus: h.ToStatus, ChangedBy: h.ChangedBy, Note: h.Note, CreatedAt: h.CreatedAt,
		})
	}

	noteStr := ""
	if order.Note != nil {
		noteStr = *order.Note
	}
	logger.InfoLogger.Printf("GetAdminOrderDetail success. OrderID: %d", orderID)
	//  Admin Response
	baseResponse := model.OrderResponse{
		ID: order.ID, OrderNumber: order.OrderNumber, Status: order.Status,
		TotalAmount: utils.FormatVND(order.TotalAmount), PaymentStatus: order.PaymentStatus, Note: noteStr,
		ShippingAddress: address, Items: itemRes, Payments: payRes,
		PlacedAt: order.PlacedAt, UpdatedAt: order.UpdatedAt,
		PaidAt:      order.PaidAt,
		CompletedAt: order.CompletedAt,
		CancelledAt: order.CancelledAt,
	}

	return &model.AdminOrderResponse{
		OrderResponse: baseResponse,
		UserID:        order.UserID,
		StatusHistory: histRes,
	}, nil
}

// Admin tìm kiếm
func (c *orderController) SearchOrders(ctx context.Context, filter model.OrderFilter) ([]model.OrderResponse, int, error) {
	logger.DebugLogger.Printf("Starting SearchOrders. Filter: %+v", filter)
	orders, total, err := c.OrderRepo.GetOrders(ctx, filter)
	if err != nil {
		logger.ErrorLogger.Printf("SearchOrders failed. Error: %v", err)
		return nil, 0, err
	}

	var response []model.OrderResponse
	for _, o := range orders {
		noteStr := ""
		if o.Note != nil {
			noteStr = *o.Note
		}
		response = append(response, model.OrderResponse{
			ID: o.ID, OrderNumber: o.OrderNumber, Status: o.Status,
			TotalAmount: utils.FormatVND(o.TotalAmount), PaymentStatus: o.PaymentStatus, Note: noteStr,
			PlacedAt: o.PlacedAt, UpdatedAt: o.UpdatedAt,
			PaidAt:      o.PaidAt,
			CompletedAt: o.CompletedAt,
			CancelledAt: o.CancelledAt,
		})
	}
	logger.InfoLogger.Printf("SearchOrders success. Found: %d", total)
	return response, total, nil
}

// Admin đổi trạng thái
func (c *orderController) UpdateOrderStatus(ctx context.Context, orderID int64, req model.AdminUpdateOrderRequest, adminID int64) error {
	logger.InfoLogger.Printf("Starting UpdateOrderStatus. OrderID: %d, AdminID: %d", orderID, adminID)

	if req.Status != "" {
		adminIDPtr := &adminID
		note := "Admin updated status"
		err := c.OrderRepo.UpdateOrderStatus(ctx, orderID, req.Status, note, adminIDPtr)
		if err != nil {
			logger.ErrorLogger.Printf("UpdateOrderStatus failed. Error: %v", err)
			return err
		}
	}
	logger.InfoLogger.Printf("UpdateOrderStatus success. OrderID: %d", orderID)
	return nil
}

// Admin xác nhận thanh toán
func (c *orderController) ConfirmPayment(ctx context.Context, orderID int64, status string, adminID int64) error {
	logger.InfoLogger.Printf("Starting ConfirmPayment. OrderID: %d, Status: %s", orderID, status)
	//  Lấy thông tin đơn hàng
	order, err := c.OrderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("ConfirmPayment: GetOrder failed. Error: %v", err)
		return err
	}

	// Đơn đã thanh toán rồi thì không thể xác nhận lại
	if order.PaymentStatus == model.PaymentStatusPaid && status == "completed" {
		logger.WarnLogger.Printf("ConfirmPayment: Order %d already paid", orderID)
		return errors.New("đơn hàng này đã được thanh toán rồi (không thể xác nhận thu tiền lại)")
	}

	// Đơn chưa thanh toán thì Không thể hoàn tiền được.
	if order.PaymentStatus == model.PaymentStatusUnpaid && status == "refunded" {
		return errors.New("đơn hàng chưa thanh toán, không thể thực hiện hoàn tiền")
	}

	amountToConfirm := order.TotalAmount
	// Chuẩn bị dữ liệu Payment mới
	now := time.Now()

	currentMethod := "UNKNOWN"
	payments, _ := c.OrderRepo.GetOrderPayments(ctx, orderID)
	if len(payments) > 0 {
		currentMethod = payments[0].Method // Lấy method của lần tạo đơn đầu tiên
	}

	var paidAtTime *time.Time = nil

	if status == "completed" {
		paidAtTime = &now
	}

	newPaymentLog := &model.OrderPayment{
		OrderID: orderID,
		Method:  currentMethod,
		Amount:  amountToConfirm,
		Status:  status,
		PaidAt:  paidAtTime,
	}

	err = c.OrderRepo.ConfirmPayment(ctx, orderID, newPaymentLog)
	if err != nil {
		logger.ErrorLogger.Printf("ConfirmPayment: Transaction failed. Error: %v", err)
		return err
	}

	logger.InfoLogger.Printf("ConfirmPayment success. OrderID: %d confirmed by AdminID: %d", orderID, adminID)
	return nil
}

// Hàm chuyển đổi OrderItem thành OrderItemResponse
func mapToItemResponse(item model.OrderItem) model.OrderItemResponse {
	var optionsParsed interface{}

	if item.OptionValues != nil && *item.OptionValues != "" {
		_ = json.Unmarshal([]byte(*item.OptionValues), &optionsParsed)
	}

	return model.OrderItemResponse{
		ID:           item.ID,
		ProductID:    item.ProductID,
		VariantID:    item.VariantID,
		SKU:          item.SKU,
		Title:        item.Title,
		OptionValues: optionsParsed,
		UnitPrice:    utils.FormatVND(item.UnitPrice),
		Quantity:     item.Quantity,
		LineSubtotal: utils.FormatVND(item.LineSubtotal),
	}
}
