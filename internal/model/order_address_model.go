package model

import "time"


const (
	OrderAddressTypeBilling  = "billing"
	OrderAddressTypeShipping = "shipping"
)

type OrderAddress struct {
	ID            int64     `json:"id"             db:"id"`
	OrderID       int64     `json:"order_id"       db:"order_id"`
	Type          string    `json:"type"           db:"type"`
	RecipientName string    `json:"recipient_name" db:"recipient_name"`
	Phone         string    `json:"phone"          db:"phone"`
	Line1         string    `json:"line1"          db:"line1"`
	Line2         string    `json:"line2"          db:"line2"` 
	City          string    `json:"city"           db:"city"`
	State         string    `json:"state"          db:"state"`
	Country       string    `json:"country"        db:"country"`
	
	CreatedAt     time.Time `json:"created_at"     db:"created_at"`
}
