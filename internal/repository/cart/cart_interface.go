package cart

import (
	"context"
	"golang/internal/model"
)

type ICartRepository interface {
	// Lấy ID giỏ hàng của user (nếu chưa có thì trả về 0 hoặc lỗi)
	GetCartIDByUserID(ctx context.Context, userID int64) (int64, error)

	// Tạo giỏ hàng mới cho user
	CreateCart(ctx context.Context, userID int64) (int64, error)

	// Lấy danh sách item thô trong giỏ (chưa join product)
	GetCartItems(ctx context.Context, cartID int64) ([]model.CartItem, error)

	// Thêm sản phẩm vào giỏ (Nếu đã có thì cộng dồn số lượng)
	UpsertCartItem(ctx context.Context, cartID int64, req model.AddToCartRequest) error

	// Cập nhật số lượng cụ thể (VD: user sửa số lượng từ 1 thành 5)
	UpdateItemQuantity(ctx context.Context, cartID int64, variantID int64, quantity int) error

	// Xóa sản phẩm
	RemoveItems(ctx context.Context, cartID int64, variantIDs []int64) error
	
	// Đếm số lượng loại sản phẩm trong giỏ (để hiện badge trên icon giỏ hàng nếu cần)
	CountCartItems(ctx context.Context, cartID int64) (int, error)
}