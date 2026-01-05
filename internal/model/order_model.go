package model

import "time"


// Trạng thái đơn hàng (Order Status)
const (
	OrderStatusPending    = "pending"    // Chờ xử lý
	OrderStatusProcessing = "processing" // Đang chuẩn bị hàng
	OrderStatusPaid       = "paid"       // Đã thanh toán 
	OrderStatusShipped    = "shipped"    // Đang giao hàng
	OrderStatusCompleted  = "completed"  // Giao thành công
	OrderStatusCancelled  = "cancelled"  // Đã hủy
	OrderStatusRefunded   = "refunded"   // Đã hoàn tiền
)

const (
	PaymentMethodCOD          = "cod"
	PaymentMethodBankTransfer = "bank_transfer"
)

const (
	PaymentStatusUnpaid            = "unpaid"
	PaymentStatusPaid              = "paid"
	PaymentStatusPartiallyRefunded = "partially_refunded"
	PaymentStatusRefunded          = "refunded"
)


type Order struct {
	ID            int64      `json:"id"              db:"id"`
	OrderNumber   string     `json:"order_number"    db:"order_number"`
	UserID        int64      `json:"user_id"         db:"user_id"`
	Status        string     `json:"status"          db:"status"`
	TotalAmount   float64    `json:"total_amount"    db:"total_amount"`
	PaymentStatus string     `json:"payment_status"  db:"payment_status"`
	Note          *string    `json:"note"            db:"note"`       
	PlacedAt      time.Time  `json:"placed_at"       db:"placed_at"`
	PaidAt        *time.Time `json:"paid_at"         db:"paid_at"`      
	CompletedAt   *time.Time `json:"completed_at"    db:"completed_at"`
	CancelledAt   *time.Time `json:"cancelled_at"    db:"cancelled_at"` 
	CreatedAt     time.Time  `json:"created_at"      db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"      db:"updated_at"`
}


type CreateOrderItemRequest struct {
	ProductID int64 `json:"product_id" validate:"required,gt=0"`
	VariantID int64 `json:"variant_id" validate:"omitempty,gt=0"` 
	Quantity  int   `json:"quantity"   validate:"required,gt=0"`
}

//  Tạo đơn hàng mới
type CreateOrderRequest struct {
	AddressID int64  `json:"address_id" validate:"required,gt=0"` 
	Note      string `json:"note"       validate:"omitempty,max=1000"`
	PaymentMethod string `json:"payment_method" validate:"required,oneof=cod bank_transfer"`
	Items []CreateOrderItemRequest `json:"items" validate:"required,min=1,dive"`
	
}

// Admin cập nhật trạng thái đơn hàng
type AdminUpdateOrderRequest struct {
	Status        string `json:"status"    validate:"required,oneof=pending processing paid shipped completed cancelled refunded"`
}

// Xác nhận thanh toán đơn hàng
type ConfirmPaymentRequest struct {
	Status string `json:"status" validate:"required,oneof=completed failed refunded"`
}

// Tìm kiếm/lọc đơn hàng
type OrderFilter struct {
	OrderID string `validate:"omitempty,max=50"` 
	Keyword string `validate:"omitempty,max=100"`
	Status string `validate:"omitempty,oneof=pending processing paid shipped completed cancelled refunded"`
	PaymentStatus string `validate:"omitempty,oneof=unpaid paid partially_refunded refunded"`
	UserID int64 `validate:"omitempty,min=0"` 
	StartDate string `validate:"omitempty,datetime=2006-01-02"`
	EndDate   string `validate:"omitempty,datetime=2006-01-02"`
	Page  int `validate:"min=1"`
	Limit int `validate:"min=1,max=100"`
}

// Trả về thông tin đơn hàng
type OrderResponse struct {
	ID            int64      `json:"id"`
	OrderNumber   string     `json:"order_number"`
	Status        string     `json:"status"`
	TotalAmount   string    `json:"total_amount"`
	PaymentStatus string     `json:"payment_status"`
	Note          string     `json:"note,omitempty"` 
	ShippingAddress *OrderAddress `json:"shipping_address,omitempty"`
	Items []OrderItemResponse `json:"items,omitempty"`
	Payments []OrderPaymentResponse `json:"payments,omitempty"`
	PlacedAt      time.Time  `json:"placed_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	PaidAt          *time.Time             `json:"paid_at,omitempty"`
	CompletedAt     *time.Time             `json:"completed_at,omitempty"`
	CancelledAt     *time.Time             `json:"cancelled_at,omitempty"`
	
}

// Trả về thông tin đơn hàng phía admin
type AdminOrderResponse struct {
	OrderResponse 
	UserID        int64                        `json:"user_id"` 
	StatusHistory []OrderStatusHistoryResponse `json:"status_history"` 
}