package model

import "time"


// Trạng thái thanh toán của đơn hàng
const (
	PaymentTransStatusPending   = "pending"   
	PaymentTransStatusCompleted = "completed" 
	PaymentTransStatusFailed    = "failed"    
	PaymentTransStatusRefunded  = "refunded" 
)


type OrderPayment struct {
	ID      int64   `json:"id"       db:"id"`
	OrderID int64   `json:"order_id" db:"order_id"`
	Method  string  `json:"method"   db:"method"` 
	Amount  float64 `json:"amount"   db:"amount"`
	Status  string  `json:"status"   db:"status"` 
	PaidAt    *time.Time `json:"paid_at"    db:"paid_at"` 
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}


// Trả về thông tin thanh toán của đơn hàng
type OrderPaymentResponse struct {
	ID        int64      `json:"id"`
	Method    string     `json:"method"`
	Amount    string    `json:"amount"`
	Status    string     `json:"status"`
	PaidAt    *time.Time `json:"paid_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}