package model

import (
	"time"
)

type OrderItem struct {
	ID           int64     `json:"id"          db:"id"`
	OrderID      int64     `json:"order_id"    db:"order_id"`
	ProductID    int64     `json:"product_id"  db:"product_id"`
	VariantID    *int64    `json:"variant_id"  db:"variant_id"`
	SKU          string    `json:"sku"           db:"sku"`
	Title        string    `json:"title"         db:"title"`
	OptionValues *string   `json:"option_values" db:"option_values"`
	UnitPrice    float64   `json:"unit_price"    db:"unit_price"`
	Quantity     int       `json:"quantity"      db:"quantity"`
	LineSubtotal float64   `json:"line_subtotal" db:"line_subtotal"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// Struct parse chuỗi JSON "OptionValues" thành Object 
type OrderItemResponse struct {
	ID        int64  `json:"id"`
	ProductID int64  `json:"product_id"`
	VariantID *int64 `json:"variant_id,omitempty"`
	SKU       string `json:"sku"`
	Title     string `json:"title"`

	// Trả về Object JSON thay vì chuỗi string
	OptionValues interface{} `json:"option_values,omitempty"`

	UnitPrice    string `json:"unit_price"`
	Quantity     int    `json:"quantity"`
	LineSubtotal string `json:"line_subtotal"`
}
