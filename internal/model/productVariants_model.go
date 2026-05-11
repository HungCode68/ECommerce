package model

import "time"

type ProductsVariants struct {
	ID             int64     `db:"id"`
	ProductID      int64     `db:"product_id"`
	SKU            string    `db:"sku"`
	Title          *string   `db:"title"`
	OptionValues   *string   `db:"option_values"`
	PriceOverride  *float64  `db:"price_override"`
	CostPrice      *float64  `db:"cost_price"`
	StockQuantity  int       `db:"stock_quantity"`
	AllowBackorder bool      `db:"allow_backorder"`
	IsActive       bool      `db:"is_active"`
	ThumbnailURL   *string   `db:"thumbnail_url"`
	CreatedAt      time.Time `db:"created_at"`
	UpdatedAt      time.Time `db:"updated_at"`
}

type CreateVariantRequest struct {
	SKU            string  `json:"sku" validate:"required"`
	Title          string  `json:"title" validate:"omitempty,min=3"`
	OptionValues   string  `json:"option_values" validate:"required"`
	PriceOverride  float64 `json:"price_override" validate:"gte=0"`
	CostPrice      float64 `json:"cost_price" validate:"gte=0"`
	StockQuantity  int     `json:"stock_quantity" validate:"gte=0"`
	IsActive       bool    `json:"is_active"`
	AllowBackorder bool    `json:"allow_backorder"`
	ThumbnailURL   string  `json:"thumbnail_url" validate:"omitempty,max=500"`
}

type UpdateVariantRequest struct {
	SKU            string  `json:"sku" validate:"required"`
	Title          string  `json:"title" validate:"omitempty,min=3"`
	OptionValues   string  `json:"option_values" validate:"required"`
	PriceOverride  float64 `json:"price_override" validate:"gte=0"`
	CostPrice      float64 `json:"cost_price" validate:"gte=0"`
	StockQuantity  int     `json:"stock_quantity" validate:"gte=0"`
	IsActive       bool    `json:"is_active"`
	AllowBackorder bool    `json:"allow_backorder"`
	ThumbnailURL   string  `json:"thumbnail_url" validate:"omitempty,max=500"`
}

type CreateVariantResponse struct {
	Message    string               `json:"msg"`
	ProVariant AdminVariantResponse `json:"variant"`
}

type UpdateVariantResponse struct {
	Message    string               `json:"msg"`
	ProVariant AdminVariantResponse `json:"variant"`
}

type DeleteVariantResponse struct {
	Message string `json:"msg"`
}

type AdminVariantResponse struct {
	ID             int64    `json:"id"`
	ProductID      int64    `json:"product_id"`
	SKU            string   `json:"sku"`
	Title          *string  `json:"title"`
	OptionValues   *string  `json:"option_values"`
	PriceOverride  *float64 `json:"price_override"`
	CostPrice      *float64 `json:"cost_price"`
	StockQuantity  int      `json:"stock_quantity"`
	IsActive       bool     `json:"is_active"`
	AllowBackorder bool     `json:"allow_backorder"`
	ThumbnailURL   *string  `json:"thumbnail_url,omitempty"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
}

type UserVariantResponse struct {
	ID            int64   `json:"id"`
	ProductID     int64   `json:"product_id"`
	SKU           string  `json:"sku"`
	Title         string  `json:"title"`
	OptionValues  string  `json:"option_values"`
	Price         float64 `json:"price"`
	StockQuantity int     `json:"stock_quantity"`
	ThumbnailURL  *string `json:"thumbnail_url,omitempty"`
}
