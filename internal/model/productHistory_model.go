package model

import (
	"encoding/json"
	"time"
)

type ProductHistory struct {
	ID        int64           `db:"id"`
	ProductID int64           `db:"product_id"`
	VariantID *int64          `db:"variant_id"`
	AdminID   *int64          `db:"admin_id"`
	ChangedAt time.Time       `db:"changed_at"`
	Changes   json.RawMessage `db:"changes"` // Lưu trữ các thay đổi dưới dạng JSON
	Note      *string         `db:"note"`
}

// ProductChangeLog - Cấu trúc lưu trữ các thay đổi của sản phẩm
type ProductChangeLog struct {
	Field    string      `json:"field"`
	OldValue interface{} `json:"old_value"`
	NewValue interface{} `json:"new_value"`
}

// request
type GetProductHistoryRequestByProductID struct {
	ProductID []int64 `json:"product_id" validate:"required,min=1"`
}

// pages, limit
type PagniationMeta struct {
	CurrentPage int `json:"current_page"`
	TotalPages  int `json:"total_pages"`
	Page        int `json:"page"`
	Limit       int `json:"limit"`
}

// Get all products history request
type GetAllProductsHistoryReponse struct {
	Message   string                   `json:"message,omitempty"`
	Meta      PagniationMeta           `json:"meta"`
	Histories []ProductHistoryResponse `json:"histories"`
}

// response
type GetProductHistoryResponse struct {
	Message   string                   `json:"message,omitempty"`
	Histories []ProductHistoryResponse `json:"histories"`
}

// ProductHistoryResponse - DTO trả về lịch sử thay đổi sản phẩm
type ProductHistoryResponse struct {
	ID        int64           `json:"id"`
	ProductID int64           `json:"product_id"`
	VariantID *int64          `json:"variant_id"`
	AdminID   *int64          `json:"admin_id"`
	ChangedAt time.Time       `json:"changed_at"`
	Changes   json.RawMessage `json:"changes"`
	Note      *string         `json:"note"`
}
