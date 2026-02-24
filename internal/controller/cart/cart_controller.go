package cart

import (
	"context"
	"errors"

	"golang/internal/logger"
	"golang/internal/model"
	cartRepo "golang/internal/repository/cart"
	productRepo "golang/internal/repository/product"
	variantRepo "golang/internal/repository/productvariant"
)

type cartController struct {
	CartRepo    cartRepo.ICartRepository
	ProductRepo productRepo.ProductRepository
	VariantRepo variantRepo.ProductVariantsRepository
}

// Constructor: Inject các Repo cần thiết
func NewCartController(
	cRepo cartRepo.ICartRepository,
	pRepo productRepo.ProductRepository,
	vRepo variantRepo.ProductVariantsRepository,
) CartController {
	return &cartController{
		CartRepo:    cRepo,
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

	var totalPrice float64 = 0
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
			// Check lại tồn kho
			if !item.StockCheck {
				return model.CheckoutPreviewResponse{}, errors.New("một số sản phẩm đã hết hàng, vui lòng kiểm tra lại")
			}

			totalPrice += item.SubTotal
			totalItems += item.Quantity
			selectedItems = append(selectedItems, item)
		}
	}

	//  Trả về kết quả
	return model.CheckoutPreviewResponse{
		TotalPrice: totalPrice,
		TotalItems: totalItems,
		Items:      selectedItems,
	}, nil
}
