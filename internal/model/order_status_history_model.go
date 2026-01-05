package model

import "time"


type OrderStatusHistory struct {
	ID      int64 `json:"id"       db:"id"`
	OrderID int64 `json:"order_id" db:"order_id"`
	FromStatus string `json:"from_status" db:"from_status"` 
	
	ToStatus   string `json:"to_status"   db:"to_status"`   
	ChangedBy  *int64 `json:"changed_by"  db:"changed_by"`   
	Note       string `json:"note"        db:"note"`         
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// Trả về log cập nhật trạng thái đơn hàng phía admin
type OrderStatusHistoryResponse struct {
	ID         int64     `json:"id"`
	FromStatus string    `json:"from_status"`
	ToStatus   string    `json:"to_status"`
	ChangedBy  *int64    `json:"changed_by"` 
	Note       string    `json:"note"`
	CreatedAt  time.Time `json:"created_at"`
}