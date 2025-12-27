package model

import (
	"time"
)


// Cart ánh xạ bảng 'carts'
type Cart struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	
	// Field ảo để preload dữ liệu khi query, không lưu trực tiếp vào bảng carts
	Items []CartItem `json:"items,omitempty"` 
}

// CartItem ánh xạ bảng 'cart_items'
type CartItem struct {
	ID        int64     `db:"id"`
	CartID    int64     `db:"cart_id"`
	VariantID int64     `db:"variant_id"`
	ProductID int64     `db:"product_id"`
	Quantity  int       `db:"quantity"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`

	// Preload relations (dùng khi join bảng để lấy thông tin chi tiết)
	Product *Product          `json:"product,omitempty"` 
	Variant *ProductsVariants `json:"variant,omitempty"` 
}


// REQUEST DTOs 

// AddToCartRequest: Dùng khi user thêm hàng vào giỏ
type AddToCartRequest struct {
	VariantID int64 `json:"variant_id" validate:"required,min=1"`
	ProductID int64 `json:"product_id"` 
	Quantity  int   `json:"quantity"   validate:"required,min=1"`
}

// UpdateCartItemRequest: Dùng khi user tăng giảm số lượng
type UpdateCartItemRequest struct {
	Quantity int `json:"quantity" validate:"required,min=1"`
}

// RemoveFromCartRequest: Dùng khi xóa 1 item (thường dùng ID trên URL, nhưng nếu cần body thì dùng cái này)
type RemoveItemRequest struct {
	VariantID int64 `json:"variant_id" validate:"required,min=1"`
}

// RemoveFromCartRequest: Dùng chung cho cả xóa 1 và xóa nhiều
type RemoveFromCartRequest struct {
	// Dùng mảng để có thể xóa nhiều món cùng lúc
	VariantIDs []int64 `json:"variant_ids" validate:"required,min=1"`
}

//  RESPONSE DTOs (Output trả về Client)

// CartItemResponse: Chi tiết từng món hàng trong giỏ 
type CartItemResponse struct {
	ItemID      int64   `json:"item_id"`      
	ProductID   int64   `json:"product_id"`
	ProductName string  `json:"product_name"` 
	VariantID   int64   `json:"variant_id"`
	VariantName string  `json:"variant_name"` 
	
	Price       float64 `json:"price"`        
	Quantity    int     `json:"quantity"`
	SubTotal    float64 `json:"sub_total"`    // Price * Quantity 
	
	StockCheck    bool `json:"stock_check"`    
	StockQuantity int  `json:"stock_quantity"` // Tồn kho thực tế 
}

// CartResponse: Trả về toàn bộ giỏ hàng
type CartResponse struct {
	ID         int64              `json:"id"`
	UserID     int64              `json:"user_id"`
	Items      []CartItemResponse `json:"items"`
}

//  CHECKOUT / CALCULATION MODELS (Tính toán trước khi đặt hàng)

// CheckoutPreviewRequest danh sách các sản phẩm được tích chọn 
type CheckoutPreviewRequest struct {
	SelectedVariantIDs []int64 `json:"selected_variant_ids" validate:"required,min=1"`
}

// CheckoutPreviewResponse: Trả về tổng tiền của các món đã chọn
type CheckoutPreviewResponse struct {
	TotalPrice    float64            `json:"total_price"`     // Tổng tiền hàng (chưa trừ gì)
	TotalItems    int                `json:"total_items"`     // Tổng số lượng sản phẩm được chọn
	
	// Trả lại danh sách chi tiết để hiển thị
	Items         []CartItemResponse `json:"items"` 
}