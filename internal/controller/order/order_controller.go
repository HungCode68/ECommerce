package order

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/repository/address"
	couponrepo "golang/internal/repository/coupons"
	repository "golang/internal/repository/order"
	"golang/internal/repository/product"
	"golang/internal/repository/productvariant"
	notificationrepo "golang/internal/repository/notification"
	"golang/internal/controller/audit"
	"golang/internal/utils"
	"strconv"
)

type orderController struct {
	OrderRepo          repository.IOrderRepository
	ProductRepo        product.ProductRepository
	ProductVariantRepo productvariant.ProductVariantsRepository
	AddressRepo        address.AddressRepo
	CouponRepo         couponrepo.CouponsRepository
	NotificationRepo   notificationrepo.NotificationRepository
	AuditCtrl          audit.AuditController
}

func NewOrderController(
	orderRepo repository.IOrderRepository,
	productRepo product.ProductRepository,
	variantRepo productvariant.ProductVariantsRepository,
	addrRepo address.AddressRepo,
	couponRepo couponrepo.CouponsRepository,
	notificationRepo notificationrepo.NotificationRepository,
	auditCtrl audit.AuditController,
) OrderController {
	return &orderController{
		OrderRepo:          orderRepo,
		ProductRepo:        productRepo,
		ProductVariantRepo: variantRepo,
		AddressRepo:        addrRepo,
		CouponRepo:         couponRepo,
		NotificationRepo:   notificationRepo,
		AuditCtrl:          auditCtrl,
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

		//  Kiểm tra tồn kho (Bỏ qua nếu là đơn đặt trước)
		if !req.IsPreorder && variant.StockQuantity < reqItem.Quantity {
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

	orderCouponCode := derefTrim(req.OrderCouponCode)
	if orderCouponCode == "" {
		orderCouponCode = derefTrim(req.CouponCode)
	}
	shippingCouponCode := derefTrim(req.ShippingCouponCode)

	orderDiscount := 0.0
	shippingFee := calculateOrderShippingFee(totalAmount)
	shippingDiscount := 0.0
	var couponIDs []int64

	if orderCouponCode != "" {
		orderCouponID, discount, err := c.validateCouponForOrder(ctx, userID, orderCouponCode, totalAmount, totalAmount, model.CouponDiscountTypePercentage, model.CouponDiscountTypeFixedAmount)
		if err != nil {
			return nil, err
		}
		orderDiscount = discount
		couponIDs = append(couponIDs, orderCouponID)
	} else {
		bestOrderCouponID, discount, err := c.findBestCouponForOrderTypes(ctx, userID, totalAmount, totalAmount, model.CouponDiscountTypePercentage, model.CouponDiscountTypeFixedAmount)
		if err != nil {
			return nil, err
		}
		if bestOrderCouponID != 0 {
			orderDiscount = discount
			couponIDs = append(couponIDs, bestOrderCouponID)
		}
	}

	if shippingCouponCode != "" {
		shippingCouponID, discount, err := c.validateCouponForOrder(ctx, userID, shippingCouponCode, totalAmount, shippingFee, model.CouponDiscountTypeShippingPercentage, model.CouponDiscountTypeShippingFixed)
		if err != nil {
			return nil, err
		}
		shippingDiscount = discount
		couponIDs = append(couponIDs, shippingCouponID)
	} else if shippingFee > 0 {
		bestShippingCouponID, discount, err := c.findBestCouponForOrderTypes(ctx, userID, totalAmount, shippingFee, model.CouponDiscountTypeShippingPercentage, model.CouponDiscountTypeShippingFixed)
		if err != nil {
			return nil, err
		}
		if bestShippingCouponID != 0 {
			shippingDiscount = discount
			couponIDs = append(couponIDs, bestShippingCouponID)
		}
	}

	finalTotalAmount := totalAmount - orderDiscount + shippingFee - shippingDiscount
	if finalTotalAmount < 0 {
		finalTotalAmount = 0
	}

	if req.IsPreorder {
		finalTotalAmount = finalTotalAmount * 0.3
		if req.Note != "" {
			req.Note += " - "
		}
		req.Note += "[ĐƠN ĐẶT TRƯỚC - Đã cọc 30%]"
		// Ensure payment method is bank_transfer
		req.PaymentMethod = model.PaymentMethodBankTransfer
	}

	orderNumber := fmt.Sprintf("ORD-%d", time.Now().UnixNano())

	// Happy Case logic: Nếu là COD thì chuyển thẳng sang status 'processing' (Đã đặt hàng thành công)
	initialStatus := model.OrderStatusPending
	if req.PaymentMethod == model.PaymentMethodCOD {
		initialStatus = model.OrderStatusProcessing
	}

	newOrder := &model.Order{
		OrderNumber:   orderNumber,
		UserID:        userID,
		Status:        initialStatus,
		PaymentStatus: model.PaymentStatusUnpaid,
		TotalAmount:   finalTotalAmount,
		Note:          &req.Note,
		PlacedAt:      time.Now(),
	}

	// Tạo Payment
	initialPayment := &model.OrderPayment{
		Method: req.PaymentMethod,
		Amount: finalTotalAmount,
		Status: model.PaymentTransStatusPending,
	}

	err = c.OrderRepo.CreateOrder(ctx, newOrder, orderItems, addressSnapshot, initialPayment, couponIDs)
	if err != nil {
		logger.ErrorLogger.Printf("CreateOrder failed for user %d: %v", userID, err)
		return nil, err
	}

	// Create notification for user
	go func() {
		_ = c.NotificationRepo.Create(&model.Notification{
			UserID:  userID,
			Title:   "Đặt hàng thành công",
			Message:     fmt.Sprintf("Đơn hàng %s của bạn đã được tạo thành công.", orderNumber),
			Type:        "ORDER_CREATED",
			ReferenceID: &newOrder.ID,
		})
	}()

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
				Amount: utils.FormatVND(finalTotalAmount),
				Status: model.PaymentTransStatusPending,
			},
		},
		PlacedAt: newOrder.PlacedAt,
	}, nil
}

func calculateOrderShippingFee(subTotal float64) float64 {
	const freeShippingThreshold = 500000.0
	const defaultShippingFee = 30000.0
	if subTotal >= freeShippingThreshold {
		return 0
	}
	return defaultShippingFee
}

func derefTrim(v *string) string {
	if v == nil {
		return ""
	}
	return strings.TrimSpace(*v)
}

func (c *orderController) validateCouponForOrder(ctx context.Context, userID int64, couponCode string, orderAmount float64, discountBaseAmount float64, allowedTypes ...string) (int64, float64, error) {
	if c.CouponRepo == nil {
		return 0, 0, errors.New("hệ thống chưa hỗ trợ mã giảm giá")
	}

	coupon, err := c.CouponRepo.GetCouponByCode(ctx, couponCode)
	if err != nil {
		return 0, 0, fmt.Errorf("mã giảm giá không tồn tại")
	}
	if !coupon.IsActive {
		return 0, 0, fmt.Errorf("mã giảm giá đã bị vô hiệu hóa")
	}
	if coupon.DiscountType == nil || coupon.DiscountValue == nil {
		return 0, 0, fmt.Errorf("mã giảm giá chưa được cấu hình đúng")
	}

	nowStr := time.Now().Format(time.RFC3339)
	if coupon.StartDate != nil && *coupon.StartDate > nowStr {
		return 0, 0, fmt.Errorf("mã giảm giá chưa đến thời gian sử dụng")
	}
	if coupon.EndDate != nil && *coupon.EndDate < nowStr {
		return 0, 0, fmt.Errorf("mã giảm giá đã hết hạn")
	}
	if coupon.UsageLimit != nil && coupon.UsageCount != nil && *coupon.UsageCount >= *coupon.UsageLimit {
		return 0, 0, fmt.Errorf("mã giảm giá đã hết lượt sử dụng")
	}

	allowed := make(map[string]bool, len(allowedTypes))
	for _, t := range allowedTypes {
		allowed[t] = true
	}
	if !allowed[*coupon.DiscountType] {
		return 0, 0, fmt.Errorf("mã giảm giá không phù hợp với loại ưu đãi")
	}

	if coupon.MinOrderValue != nil && orderAmount < *coupon.MinOrderValue {
		return 0, 0, fmt.Errorf("đơn hàng chưa đạt giá trị tối thiểu để áp mã")
	}

	if coupon.UserUsageLimit != nil && *coupon.UserUsageLimit > 0 {
		count, err := c.CouponRepo.CountUserUsage(ctx, coupon.ID, userID)
		if err != nil {
			return 0, 0, fmt.Errorf("không thể kiểm tra lượt sử dụng mã giảm giá")
		}
		if int64(count) >= *coupon.UserUsageLimit {
			return 0, 0, fmt.Errorf("bạn đã hết lượt sử dụng mã giảm giá này")
		}
	}

	discountAmount := 0.0
	switch *coupon.DiscountType {
	case model.CouponDiscountTypePercentage, model.CouponDiscountTypeShippingPercentage:
		discountAmount = discountBaseAmount * (*coupon.DiscountValue) / 100
		if coupon.MaxDiscountAmount != nil && discountAmount > *coupon.MaxDiscountAmount {
			discountAmount = *coupon.MaxDiscountAmount
		}
	case model.CouponDiscountTypeFixedAmount, model.CouponDiscountTypeShippingFixed:
		discountAmount = *coupon.DiscountValue
	}
	if discountAmount > discountBaseAmount {
		discountAmount = discountBaseAmount
	}

	return coupon.ID, discountAmount, nil
}

func (c *orderController) findBestCouponForOrderTypes(ctx context.Context, userID int64, orderAmount float64, discountBaseAmount float64, allowedTypes ...string) (int64, float64, error) {
	if c.CouponRepo == nil || discountBaseAmount <= 0 {
		return 0, 0, nil
	}

	coupons, err := c.CouponRepo.GetAvailableCoupons(ctx, model.GetAvailableCouponsRequest{
		UserID:      userID,
		OrderAmount: orderAmount,
	})
	if err != nil {
		return 0, 0, fmt.Errorf("không thể tải danh sách mã giảm giá")
	}

	allowed := make(map[string]bool, len(allowedTypes))
	for _, t := range allowedTypes {
		allowed[t] = true
	}

	var bestCouponID int64
	bestDiscount := 0.0
	for i := range coupons {
		coupon := coupons[i]
		if coupon.DiscountType == nil || coupon.DiscountValue == nil || !allowed[*coupon.DiscountType] {
			continue
		}

		if coupon.UserUsageLimit != nil && *coupon.UserUsageLimit > 0 {
			count, err := c.CouponRepo.CountUserUsage(ctx, coupon.ID, userID)
			if err != nil {
				continue
			}
			if int64(count) >= *coupon.UserUsageLimit {
				continue
			}
		}

		discount := calculateOrderCouponDiscountAmount(coupon, discountBaseAmount)
		if discount > bestDiscount {
			bestDiscount = discount
			bestCouponID = coupon.ID
		}
	}

	return bestCouponID, bestDiscount, nil
}

func calculateOrderCouponDiscountAmount(coupon model.Coupons, discountBaseAmount float64) float64 {
	if coupon.DiscountType == nil || coupon.DiscountValue == nil || discountBaseAmount <= 0 {
		return 0
	}

	discountAmount := 0.0
	switch *coupon.DiscountType {
	case model.CouponDiscountTypePercentage, model.CouponDiscountTypeShippingPercentage:
		discountAmount = discountBaseAmount * (*coupon.DiscountValue) / 100
		if coupon.MaxDiscountAmount != nil && discountAmount > *coupon.MaxDiscountAmount {
			discountAmount = *coupon.MaxDiscountAmount
		}
	case model.CouponDiscountTypeFixedAmount, model.CouponDiscountTypeShippingFixed:
		discountAmount = *coupon.DiscountValue
	}
	if discountAmount > discountBaseAmount {
		discountAmount = discountBaseAmount
	}
	if discountAmount < 0 {
		return 0
	}
	return discountAmount
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

	paymentMethod := "cod"
	if len(payments) > 0 {
		paymentMethod = payments[0].Method
	}

	noteStr := ""
	if order.Note != nil {
		noteStr = *order.Note
	}
	cancelReasonStr := ""
	if order.CancelReason != nil {
		cancelReasonStr = *order.CancelReason
	}
	logger.InfoLogger.Printf("GetMyOrder success for UserID: %d", userID)
	return &model.OrderResponse{
		ID:              order.ID,
		OrderNumber:     order.OrderNumber,
		UserID:          order.UserID,
		CustomerName:    order.CustomerName,
		FirstItemTitle:  order.FirstItemTitle,
		AllItemTitles:   order.AllItemTitles,
		ItemCount:       order.ItemCount,
		Status:          order.Status,
		TotalAmount:     utils.FormatVND(order.TotalAmount),
		PaymentStatus:   order.PaymentStatus,
		PaymentMethod:   paymentMethod,
		Note:            noteStr,
		CancelReason:    cancelReasonStr,
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

// Xem chi tiết đơn hàng bằng mã đơn hàng (order_number)
func (c *orderController) GetMyOrderByCode(ctx context.Context, userID int64, orderCode string) (*model.OrderResponse, error) {
	logger.DebugLogger.Printf("Starting GetMyOrderByCode. UserID: %d, Code: %s", userID, orderCode)
	order, err := c.OrderRepo.GetByOrderNumber(ctx, orderCode)
	if err != nil {
		logger.ErrorLogger.Printf("GetMyOrderByCode: Order not found. Code: %s. Error: %v", orderCode, err)
		return nil, err
	}
	return c.GetMyOrder(ctx, userID, order.ID)
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
			ID:             o.ID,
			OrderNumber:    o.OrderNumber,
			UserID:         o.UserID,
			CustomerName:   o.CustomerName,
			FirstItemTitle: o.FirstItemTitle,
			AllItemTitles:  o.AllItemTitles,
			ItemCount:      o.ItemCount,
			Status:         o.Status,
			TotalAmount:    utils.FormatVND(o.TotalAmount),
			PaymentStatus:  o.PaymentStatus,
			Note:           noteStr,
			PlacedAt:       o.PlacedAt,
			UpdatedAt:      o.UpdatedAt,
			PaidAt:         o.PaidAt,
			CompletedAt:    o.CompletedAt,
			CancelledAt:    o.CancelledAt,
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

	// Check trạng thái: Chỉ được hủy khi đang Pending hoặc Processing
	if order.Status != model.OrderStatusPending && order.Status != model.OrderStatusProcessing {
		logger.WarnLogger.Printf("CancelOrder: Invalid status '%s' for OrderID: %d", order.Status, orderID)
		return errors.New("đơn hàng đã giao cho đơn vị vận chuyển hoặc không thể hủy")
	}

	// Gọi Repo update
	fullReason := fmt.Sprintf("Khách hủy: %s", reason)
	userIDPtr := &userID

	err = c.OrderRepo.UpdateOrderStatus(ctx, orderID, model.OrderStatusCancelled, fullReason, userIDPtr)
	if err != nil {
		logger.ErrorLogger.Printf("CancelOrder: UpdateStatus failed. Error: %v", err)
		return err
	}

	// Create notification for user
	go func() {
		_ = c.NotificationRepo.Create(&model.Notification{
			UserID:  userID,
			Title:   "Hủy đơn hàng thành công",
			Message:     fmt.Sprintf("Đơn hàng %s của bạn đã được hủy thành công. Lý do: %s", order.OrderNumber, reason),
			Type:        "ORDER_CANCELED",
			ReferenceID: &orderID,
		})
	}()

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

	paymentMethod := "cod"
	if len(payments) > 0 {
		paymentMethod = payments[0].Method
	}

	noteStr := ""
	if order.Note != nil {
		noteStr = *order.Note
	}
	cancelReasonStr := ""
	if order.CancelReason != nil {
		cancelReasonStr = *order.CancelReason
	}
	logger.InfoLogger.Printf("GetAdminOrderDetail success. OrderID: %d", orderID)
	//  Admin Response
	baseResponse := model.OrderResponse{
		ID: order.ID, OrderNumber: order.OrderNumber, UserID: order.UserID, CustomerName: order.CustomerName,
		FirstItemTitle: order.FirstItemTitle, AllItemTitles: order.AllItemTitles, ItemCount: len(itemRes), Status: order.Status,
		TotalAmount: utils.FormatVND(order.TotalAmount), PaymentStatus: order.PaymentStatus, PaymentMethod: paymentMethod, Note: noteStr,
		CancelReason: cancelReasonStr,
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
		cancelReasonStr := ""
		if o.CancelReason != nil {
			cancelReasonStr = *o.CancelReason
		}
		response = append(response, model.OrderResponse{
			ID:             o.ID,
			OrderNumber:    o.OrderNumber,
			UserID:         o.UserID,
			CustomerName:   o.CustomerName,
			FirstItemTitle: o.FirstItemTitle,
			AllItemTitles:  o.AllItemTitles,
			ItemCount:      o.ItemCount,
			Status:         o.Status,
			TotalAmount:    utils.FormatVND(o.TotalAmount),
			PaymentStatus:  o.PaymentStatus,
			Note:           noteStr,
			CancelReason:   cancelReasonStr,
			PlacedAt:       o.PlacedAt,
			UpdatedAt:      o.UpdatedAt,
			PaidAt:         o.PaidAt,
			CompletedAt:    o.CompletedAt,
			CancelledAt:    o.CancelledAt,
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
		
		reqJSON, _ := json.Marshal(req)
		reqStr := string(reqJSON)
		c.AuditCtrl.LogAction(adminID, "UPDATE_STATUS", "ORDER", strconv.FormatInt(orderID, 10), nil, &reqStr)
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

	newPaymentJSON, _ := json.Marshal(newPaymentLog)
	newPaymentStr := string(newPaymentJSON)
	c.AuditCtrl.LogAction(adminID, "CONFIRM_PAYMENT", "ORDER", strconv.FormatInt(orderID, 10), nil, &newPaymentStr)

	logger.InfoLogger.Printf("ConfirmPayment success. OrderID: %d confirmed by AdminID: %d", orderID, adminID)
	return nil
}

// UserConfirmTransferred: Khách hàng thông báo xác nhận đã chuyển tiền
func (c *orderController) UserConfirmTransferred(ctx context.Context, userID int64, orderID int64) error {
	logger.InfoLogger.Printf("UserConfirmTransferred: UserID %d confirming transfer for OrderID %d", userID, orderID)

	// Lấy thông tin đơn hàng
	order, err := c.OrderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		logger.ErrorLogger.Printf("UserConfirmTransferred failed: Order ID %d not found. Error: %v", orderID, err)
		return errors.New("không tìm thấy đơn hàng")
	}

	// Kiểm tra quyền sở hữu đơn hàng
	if order.UserID != userID {
		logger.WarnLogger.Printf("UserConfirmTransferred: User %d unauthorized to access order %d", userID, orderID)
		return errors.New("bạn không có quyền thực hiện thao tác này")
	}

	// Đơn hàng đã được thanh toán rồi
	if order.PaymentStatus == model.PaymentStatusPaid {
		logger.WarnLogger.Printf("UserConfirmTransferred: Order %d already paid", orderID)
		return errors.New("đơn hàng này đã được thanh toán rồi")
	}

	// Đơn hàng đã bị hủy
	if order.Status == model.OrderStatusCancelled {
		logger.WarnLogger.Printf("UserConfirmTransferred: Order %d already cancelled", orderID)
		return errors.New("đơn hàng đã bị huỷ, không thể xác nhận thanh toán")
	}

	// 1. Tạo một Payment log mới ở trạng thái 'processing' (Đang đối soát)
	payments, _ := c.OrderRepo.GetOrderPayments(ctx, orderID)
	currentMethod := "bank_transfer"
	if len(payments) > 0 {
		currentMethod = payments[0].Method
	}

	now := time.Now()
	newPaymentLog := &model.OrderPayment{
		OrderID: orderID,
		Method:  currentMethod,
		Amount:  order.TotalAmount,
		Status:  "completed", // Đã thanh toán thành công (Happy Case)
		PaidAt:  &now,
	}

	err = c.OrderRepo.ConfirmPayment(ctx, orderID, newPaymentLog)
	if err != nil {
		logger.ErrorLogger.Printf("UserConfirmTransferred: ConfirmPayment failed. Error: %v", err)
		return errors.New("không thể cập nhật trạng thái thanh toán")
	}

	// 2. Ghi nhận log lịch sử đơn hàng
	note := "Khách hàng xác nhận đã chuyển khoản thành công."
	userIDPtr := &userID
	err = c.OrderRepo.UpdateOrderStatus(ctx, orderID, model.OrderStatusProcessing, note, userIDPtr)
	if err != nil {
		logger.ErrorLogger.Printf("UserConfirmTransferred: UpdateOrderStatus failed. Error: %v", err)
		return errors.New("không thể ghi nhận lịch sử đơn hàng")
	}

	logger.InfoLogger.Printf("UserConfirmTransferred success. OrderID: %d confirmed by UserID: %d", orderID, userID)
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
