package cart

import (
	"context"
	"golang/internal/model"
)

type CartController interface {
	//  Lấy chi tiết giỏ hàng (kèm thông tin sản phẩm, giá, tính tổng tiền...)
	GetCart(ctx context.Context, userID int64) (model.CartResponse, error)

	//  Thêm sản phẩm vào giỏ (Logic cộng dồn)
	AddToCart(ctx context.Context, userID int64, req model.AddToCartRequest) error

	//  Cập nhật số lượng item (Logic ghi đè)
	UpdateCartItem(ctx context.Context, userID int64, variantID int64, req model.UpdateCartItemRequest) error

	//  Xóa một hoặc nhiều sản phẩm khỏi giỏ
	RemoveCartItems(ctx context.Context, userID int64, req model.RemoveFromCartRequest) error

	//  (Tính năng nâng cao) Tính toán tạm tính cho các sản phẩm được chọn (Checkbox)
	CalculateCheckoutPreview(ctx context.Context, userID int64, req model.CheckoutPreviewRequest) (model.CheckoutPreviewResponse, error)
}