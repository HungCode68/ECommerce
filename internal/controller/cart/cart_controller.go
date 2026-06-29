package cart

import (
	"context"
	"errors"
	"strings"
	"time"

	"golang/internal/logger"
	"golang/internal/model"
	cartRepo "golang/internal/repository/cart"
	couponRepo "golang/internal/repository/coupons"
	productRepo "golang/internal/repository/product"
	variantRepo "golang/internal/repository/productvariant"
)

type cartController struct {
	CartRepo    cartRepo.ICartRepository
	CouponRepo  couponRepo.CouponsRepository
	ProductRepo productRepo.ProductRepository
	VariantRepo variantRepo.ProductVariantsRepository
}

// Constructor: Inject các Repo cần thiết
func NewCartController(
	cRepo cartRepo.ICartRepository,
	cpRepo couponRepo.CouponsRepository,
	pRepo productRepo.ProductRepository,
	vRepo variantRepo.ProductVariantsRepository,
) CartController {
	return &cartController{
		CartRepo:    cRepo,
		CouponRepo:  cpRepo,
		ProductRepo: pRepo,
		VariantRepo: vRepo,
	}
}

// GetCart: Lấy chi tiết giỏ hàng (Sử dụng JOIN query để tránh N+1)
func (c *cartController) GetCart(ctx context.Context, userID int64) (model.CartResponse, error) {
	logger.DebugLogger.Printf("Controller: Getting cart for user %d", userID)

	// Lấy ID giỏ hàng
	cartID, err := c.CartRepo.GetCartIDByUserID(ctx, userID)
	if err != nil {
		return model.CartResponse{}, err
	}

	if cartID == 0 {
		return model.CartResponse{UserID: userID, Items: []model.CartItemResponse{}}, nil
	}

	// Sử dụng method mới với JOIN query - không còn N+1 nữa
	items, err := c.CartRepo.GetCartItemsWithDetails(ctx, cartID)
	if err != nil {
		logger.ErrorLogger.Printf("Controller: Failed to get cart items: %v", err)
		return model.CartResponse{}, err
	}

	// Nếu items nil, khởi tạo slice trống
	if items == nil {
		items = []model.CartItemResponse{}
	}

	return model.CartResponse{
		ID:     cartID,
		UserID: userID,
		Items:  items,
	}, nil
}

// AddToCart: Thêm vào giỏ (Cộng dồn)
func (c *cartController) AddToCart(ctx context.Context, userID int64, req model.AddToCartRequest) error {
	logger.DebugLogger.Printf("Controller: User %d adding variant %d to cart", userID, req.VariantID)

	//  Lấy ID giỏ hàng, nếu chưa có thì tạo mới
	cartID, err := c.CartRepo.GetCartIDByUserID(ctx, userID)
	if err != nil {
		return err
	}
	if cartID == 0 {
		cartID, err = c.CartRepo.CreateCart(ctx, userID)
		if err != nil {
			return err
		}
	}

	//  Kiểm tra sản phẩm và biến thể có tồn tại không
	variant, err := c.VariantRepo.GetVariantByID(req.VariantID)
	if err != nil || variant == nil {
		return errors.New("sản phẩm (biến thể) không tồn tại")
	}

	// Tự động điền ProductID nếu request thiếu (dựa vào variant)
	if req.ProductID == 0 {
		req.ProductID = variant.ProductID
	}

	// Kiểm tra tồn kho
	if req.Quantity > variant.StockQuantity {
		return errors.New("số lượng yêu cầu vượt quá tồn kho hiện tại")
	}

	// Gọi Repo để Upsert (Thêm mới hoặc cộng dồn)
	err = c.CartRepo.UpsertCartItem(ctx, cartID, req)
	if err != nil {
		return err
	}

	return nil
}

// UpdateCartItem: Cập nhật số lượng
func (c *cartController) UpdateCartItem(ctx context.Context, userID int64, variantID int64, req model.UpdateCartItemRequest) error {
	//  Tìm giỏ hàng
	cartID, err := c.CartRepo.GetCartIDByUserID(ctx, userID)
	if err != nil || cartID == 0 {
		return errors.New("giỏ hàng không tìm thấy")
	}

	// Kiểm tra tồn kho trước khi update
	variant, err := c.VariantRepo.GetVariantByID(variantID)
	if err != nil || variant == nil {
		return errors.New("sản phẩm không tồn tại")
	}

	// Check số lượng tồn kho (req.Quantity lấy từ Body JSON)
	if req.Quantity > variant.StockQuantity {
		return errors.New("số lượng trong kho không đủ")
	}

	// Gọi Repo Update
	return c.CartRepo.UpdateItemQuantity(ctx, cartID, variantID, req.Quantity)
}

// RemoveCartItems: Xóa sản phẩm
func (c *cartController) RemoveCartItems(ctx context.Context, userID int64, req model.RemoveFromCartRequest) error {
	cartID, err := c.CartRepo.GetCartIDByUserID(ctx, userID)
	if err != nil || cartID == 0 {
		return errors.New("giỏ hàng không tìm thấy")
	}

	return c.CartRepo.RemoveItems(ctx, cartID, req.VariantIDs)
}

// CalculateCheckoutPreview: Tính tiền cho các món được chọn
func (c *cartController) CalculateCheckoutPreview(ctx context.Context, userID int64, req model.CheckoutPreviewRequest) (model.CheckoutPreviewResponse, error) {
	//  Lấy toàn bộ giỏ hàng
	fullCart, err := c.GetCart(ctx, userID)
	if err != nil {
		return model.CheckoutPreviewResponse{}, err
	}

	var subTotal float64 = 0
	var totalItems int = 0
	var selectedItems []model.CartItemResponse

	// Map để tra cứu nhanh các ID được chọn
	selectedMap := make(map[int64]bool)
	for _, id := range req.SelectedVariantIDs {
		selectedMap[id] = true
	}

	// Lọc ra những món user chọn và tính tổng
	for _, item := range fullCart.Items {
		if selectedMap[item.VariantID] {
			// Check xem sản phẩm có bị xóa không
			if item.IsDeleted {
				return model.CheckoutPreviewResponse{}, errors.New("một số sản phẩm đã ngừng kinh doanh, vui lòng gỡ khỏi giỏ hàng")
			}

			// Check lại tồn kho
			if !item.StockCheck {
				return model.CheckoutPreviewResponse{}, errors.New("một số sản phẩm đã hết hàng, vui lòng kiểm tra lại")
			}

			subTotal += item.SubTotal
			totalItems += item.Quantity
			selectedItems = append(selectedItems, item)
		}
	}

	if len(selectedItems) == 0 {
		return model.CheckoutPreviewResponse{}, errors.New("vui lòng chọn ít nhất 1 sản phẩm để thanh toán")
	}

	orderCouponCode := strings.TrimSpace(req.OrderCouponCode)
	shippingCouponCode := strings.TrimSpace(req.ShippingCouponCode)
	if orderCouponCode == "" && strings.TrimSpace(req.CouponCode) != "" {
		orderCouponCode = strings.TrimSpace(req.CouponCode)
	}

	orderDiscount := 0.0
	var orderCoupon *model.AppliedCouponPreview
	if orderCouponCode != "" {
		discount, couponInfo, err := c.validateAndCalculateCoupon(ctx, userID, orderCouponCode, subTotal, subTotal, model.CouponDiscountTypePercentage, model.CouponDiscountTypeFixedAmount)
		if err != nil {
			return model.CheckoutPreviewResponse{}, err
		}
		orderDiscount = discount
		orderCoupon = couponInfo
	} else {
		discount, couponInfo, err := c.findBestCouponForTypes(ctx, userID, subTotal, subTotal, model.CouponDiscountTypePercentage, model.CouponDiscountTypeFixedAmount)
		if err != nil {
			return model.CheckoutPreviewResponse{}, err
		}
		orderDiscount = discount
		orderCoupon = couponInfo
	}

	shippingFee := calculateShippingFee(subTotal)

	shippingDiscount := 0.0
	var shippingCoupon *model.AppliedCouponPreview
	if shippingCouponCode != "" {
		discount, couponInfo, err := c.validateAndCalculateCoupon(ctx, userID, shippingCouponCode, subTotal, shippingFee, model.CouponDiscountTypeShippingPercentage, model.CouponDiscountTypeShippingFixed)
		if err != nil {
			return model.CheckoutPreviewResponse{}, err
		}
		shippingDiscount = discount
		shippingCoupon = couponInfo
	} else if shippingFee > 0 {
		discount, couponInfo, err := c.findBestCouponForTypes(ctx, userID, subTotal, shippingFee, model.CouponDiscountTypeShippingPercentage, model.CouponDiscountTypeShippingFixed)
		if err != nil {
			return model.CheckoutPreviewResponse{}, err
		}
		shippingDiscount = discount
		shippingCoupon = couponInfo
	}

	discountAmount := orderDiscount + shippingDiscount
	totalPayable := subTotal - orderDiscount + shippingFee - shippingDiscount

	//  Trả về kết quả
	return model.CheckoutPreviewResponse{
		TotalPrice:       subTotal,
		TotalItems:       totalItems,
		SubTotal:         subTotal,
		DiscountAmount:   discountAmount,
		OrderDiscount:    orderDiscount,
		ShippingFee:      shippingFee,
		ShippingDiscount: shippingDiscount,
		TotalPayable:     totalPayable,
		OrderCoupon:      orderCoupon,
		ShippingCoupon:   shippingCoupon,
		Items:            selectedItems,
	}, nil
}

func calculateShippingFee(subTotal float64) float64 {
	const freeShippingThreshold = 500000.0
	const defaultShippingFee = 30000.0
	if subTotal >= freeShippingThreshold {
		return 0
	}
	return defaultShippingFee
}

func (c *cartController) validateAndCalculateCoupon(ctx context.Context, userID int64, couponCode string, orderAmount float64, discountBaseAmount float64, allowedTypes ...string) (float64, *model.AppliedCouponPreview, error) {
	if c.CouponRepo == nil {
		return 0, nil, errors.New("hệ thống chưa hỗ trợ mã giảm giá cho bước này")
	}

	coupon, err := c.CouponRepo.GetCouponByCode(ctx, couponCode)
	if err != nil {
		return 0, nil, errors.New("mã giảm giá không tồn tại")
	}

	if !coupon.IsActive {
		return 0, nil, errors.New("mã giảm giá đã bị vô hiệu hóa")
	}

	nowStr := time.Now().Format("2006-01-02 15:04:05")
	if coupon.StartDate != nil && *coupon.StartDate > nowStr {
		return 0, nil, errors.New("mã giảm giá chưa đến thời gian sử dụng")
	}
	if coupon.EndDate != nil && *coupon.EndDate < nowStr {
		return 0, nil, errors.New("mã giảm giá đã hết hạn")
	}

	if coupon.UsageLimit != nil && coupon.UsageCount != nil && *coupon.UsageCount >= *coupon.UsageLimit {
		return 0, nil, errors.New("mã giảm giá đã hết lượt sử dụng")
	}

	if coupon.DiscountType == nil || coupon.DiscountValue == nil {
		return 0, nil, errors.New("mã giảm giá chưa được cấu hình đúng")
	}

	allowed := make(map[string]bool, len(allowedTypes))
	for _, t := range allowedTypes {
		allowed[t] = true
	}
	if !allowed[*coupon.DiscountType] {
		return 0, nil, errors.New("mã giảm giá không phù hợp với loại ưu đãi đang áp dụng")
	}

	if coupon.MinOrderValue != nil && orderAmount < *coupon.MinOrderValue {
		return 0, nil, errors.New("đơn hàng chưa đạt giá trị tối thiểu để áp mã")
	}

	if coupon.UseUsageLimit != nil && *coupon.UseUsageLimit && coupon.UserUsageLimit != nil && *coupon.UserUsageLimit > 0 {
		usageCount, err := c.CouponRepo.CountUserUsage(ctx, coupon.ID, userID)
		if err != nil {
			logger.ErrorLogger.Printf("CountUserUsage failed (couponID=%d, userID=%d): %v", coupon.ID, userID, err)
			return 0, nil, errors.New("không thể kiểm tra lượt sử dụng mã giảm giá")
		}
		if int64(usageCount) >= *coupon.UserUsageLimit {
			return 0, nil, errors.New("bạn đã hết lượt sử dụng mã giảm giá này")
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

	return discountAmount, &model.AppliedCouponPreview{
		CouponID:       coupon.ID,
		Code:           coupon.Code,
		DiscountAmount: discountAmount,
		Message:        "Áp dụng mã giảm giá thành công",
	}, nil
}

func (c *cartController) findBestCouponForTypes(ctx context.Context, userID int64, orderAmount float64, discountBaseAmount float64, allowedTypes ...string) (float64, *model.AppliedCouponPreview, error) {
	if c.CouponRepo == nil || discountBaseAmount <= 0 {
		return 0, nil, nil
	}

	coupons, err := c.CouponRepo.GetAvailableCoupons(ctx, model.GetAvailableCouponsRequest{
		UserID:      userID,
		OrderAmount: orderAmount,
	})
	if err != nil {
		logger.ErrorLogger.Printf("findBestCouponForTypes query failed (userID=%d): %v", userID, err)
		return 0, nil, errors.New("không thể tải danh sách mã giảm giá khả dụng")
	}

	allowed := make(map[string]bool, len(allowedTypes))
	for _, t := range allowedTypes {
		allowed[t] = true
	}

	bestDiscount := 0.0
	var bestCoupon *model.Coupons
	for i := range coupons {
		coupon := coupons[i]
		if coupon.DiscountType == nil || coupon.DiscountValue == nil || !allowed[*coupon.DiscountType] {
			continue
		}

		if coupon.UseUsageLimit != nil && *coupon.UseUsageLimit && coupon.UserUsageLimit != nil && *coupon.UserUsageLimit > 0 {
			usageCount, err := c.CouponRepo.CountUserUsage(ctx, coupon.ID, userID)
			if err != nil {
				logger.ErrorLogger.Printf("CountUserUsage failed while finding best coupon (couponID=%d, userID=%d): %v", coupon.ID, userID, err)
				continue
			}
			if int64(usageCount) >= *coupon.UserUsageLimit {
				continue
			}
		}

		discount := calculateCouponDiscountAmount(coupon, discountBaseAmount)
		if discount > bestDiscount {
			bestDiscount = discount
			bestCoupon = &coupon
		}
	}

	if bestCoupon == nil || bestDiscount <= 0 {
		return 0, nil, nil
	}

	return bestDiscount, &model.AppliedCouponPreview{
		CouponID:       bestCoupon.ID,
		Code:           bestCoupon.Code,
		DiscountAmount: bestDiscount,
		Message:        "Hệ thống tự động áp dụng mã tối ưu",
	}, nil
}

func calculateCouponDiscountAmount(coupon model.Coupons, discountBaseAmount float64) float64 {
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
