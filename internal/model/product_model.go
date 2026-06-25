package model

import (
	"time"
)

// =================================================================
// 1. PRODUCT MODEL (Ánh xạ CSDL)
// =================================================================

// Product ánh xạ trực tiếp với bảng 'products' trong CSDL
type Product struct {
	ID               int64   `db:"id"`
	Name             string  `db:"name"`
	Slug             string  `db:"slug"`
	ThumbnailURL     *string `db:"thumbnail_url" json:"thumbnail_url,omitempty"`
	ShortDescription *string `db:"short_description"` // Có thể NULL
	Description      *string `db:"description"`       // Có thể NULL
	Brand            *string `db:"brand"`             // Có thể NULL
	Status           string  `db:"status"`
	IsPublished      bool    `db:"is_published"`

	PublishedAt *time.Time `db:"published_at"` // Có thể NULL

	MinPrice        float64  `db:"min_price"`
	PriceOverride   *float64 `db:"price_override"`
	DiscountPercent float64  `db:"discount_percent"`
	AvgRating       float64 `db:"avg_rating"`
	RatingCount     int     `db:"rating_count"`
	CreatedBy       *int64  `db:"created_by"` // Có thể NULL
	UpdatedBy       *int64  `db:"updated_by"` // Có thể NULL

	CreatedAt        time.Time          `db:"created_at"`
	UpdatedAt        time.Time          `db:"updated_at"`
	DeletedAt        *time.Time         `db:"deleted_at"` // Có thể NULL
	IsCouponEligible bool               `db:"is_coupon_eligible"`
	Categories       []Category         `json:"categories,omitempty"`
	Variants         []ProductsVariants `json:"variants,omitempty"`
	Reviews          []ProductReview    `json:"reviews,omitempty"`
}

// 2. REQUEST DTOs (Data Transfer Objects - Nhận Input)

// GetProductRequest dùng cho tìm kiếm chi tiết một sản phẩm
type GetProductRequest struct {
	ID   int64  `json:"id,omitempty" validate:"omitempty,min=1"`
	Name string `json:"name,omitempty" validate:"omitempty,min=3,max=255"`
	Slug string `json:"slug,omitempty" validate:"omitempty,min=3,max=255"`
}

// CreateProductRequest dùng cho việc thêm sản phẩm mới (Admin)
type CreateProductRequest struct {
	Name             string  `json:"name" validate:"required,min=2,max=255"`
	Slug             string  `json:"slug" validate:"omitempty,min=2,max=255"`
	ThumbnailURL     string  `json:"thumbnail_url" validate:"omitempty,max=500"`
	MinPrice         float64  `json:"min_price" validate:"omitempty,gte=0"`
	PriceOverride    *float64 `json:"price_override" validate:"omitempty,gte=0"`
	DiscountPercent  float64  `json:"discount_percent" validate:"omitempty,gte=0,lte=100"`
	ShortDescription string  `json:"short_description" validate:"omitempty,max=500"`
	Description      string  `json:"description" validate:"omitempty"`
	Brand            string  `json:"brand" validate:"omitempty,max=100"`
	Status           string  `json:"status" validate:"omitempty,oneof=draft active inactive archived"`
	IsPublished      bool    `json:"is_published"`
	IsCouponEligible bool    `json:"is_coupon_eligible"`
	PublishedAt      string  `json:"published_at" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	CategoryIDs      []int64 `json:"category_ids" validate:"required,min=1"`
}

// UpdateProductRequest dùng cho việc cập nhật sản phẩm (Admin)
type UpdateProductRequest struct {
	Name             string   `json:"name" validate:"omitempty,min=3,max=255"`
	Slug             string   `json:"slug" validate:"omitempty,min=3,max=255"`
	ThumbnailURL     string   `json:"thumbnail_url" validate:"omitempty,max=500"`
	MinPrice         *float64 `json:"min_price" validate:"omitempty,min=0"`
	PriceOverride    *float64 `json:"price_override" validate:"omitempty,min=0"`
	DiscountPercent  *float64 `json:"discount_percent" validate:"omitempty,gte=0,lte=100"`
	ShortDescription string   `json:"short_description" validate:"omitempty,max=500"`
	Description      string   `json:"description" validate:"omitempty"`
	Brand            string   `json:"brand" validate:"omitempty,max=100"`
	Status           string   `json:"status" validate:"omitempty,oneof=draft active inactive archived"`
	IsPublished      *bool    `json:"is_published"`
	PublishedAt      string   `json:"published_at" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	Note             string   `json:"note" validate:"omitempty,max=1000"`
	CategoryIDs      []int64  `json:"category_ids" validate:"omitempty,min=1"`
	IsCouponEligible *bool    `json:"is_coupon_eligible"`
}

// DeleteProductRequest dùng cho việc xóa sản phẩm (Admin)
type DeleteProductRequest struct {
	ID int64 `json:"id" validate:"required,min=1"`
}

// BulkDeleteProductRequest - Xóa nhiều sản phẩm cùng lúc (Admin)
type BulkDeleteProductRequest struct {
	IDs []int64 `json:"ids" validate:"required,min=1,dive,min=1"`
}

// GetManyProductsRequest - Lấy nhiều sản phẩm theo danh sách IDs
type GetManyProductsRequest struct {
	IDs []int64 `json:"ids" validate:"required,min=1,max=100,dive,min=1"`
}

// SearchProductsRequest - Tìm kiếm sản phẩm (hỗ trợ lọc giá + phân trang + sắp xếp)
type SearchProductsRequest struct {
	Search         string   `json:"search" validate:"omitempty,max=255"`
	Brand          string   `json:"brand" validate:"omitempty,max=100"`
	CategoryID     int64    `json:"category_id" validate:"omitempty,min=1"`
	MinPriceFilter *float64 `json:"min_price" validate:"omitempty,gte=0"`
	MaxPriceFilter *float64 `json:"max_price" validate:"omitempty,gte=0"`
	Page           int      `json:"page" validate:"omitempty,min=1"`
	Limit          int      `json:"limit" validate:"omitempty,min=1,max=100"`
	SortBy         string   `json:"sort_by" validate:"omitempty,oneof=price rating newest name"`
	SortOrder      string   `json:"sort_order" validate:"omitempty,oneof=asc desc"`
}

// PaginationMeta - Thông tin phân trang trong response
type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// =================================================================
// 3. RESPONSE DTOs - USER (Trả về cho khách hàng)
// =================================================================

// UserProductResponse - Thông tin sản phẩm cho User
type UserProductResponse struct {
	ID               int64   `json:"id"`
	Name             string  `json:"name"`
	Slug             *string `json:"slug,omitempty"`
	ThumbnailURL     *string `json:"thumbnail_url,omitempty"`
	ShortDescription *string `json:"short_description,omitempty"`
	Brand            *string `json:"brand,omitempty"`
	MinPrice         float64  `json:"min_price"`
	PriceOverride    *float64 `json:"price_override,omitempty"`
	DiscountPercent  float64  `json:"discount_percent"`
	FinalPrice       float64  `json:"final_price"`
	Stock            int     `json:"stock"`
}

// UserProductListResponse - Danh sách sản phẩm cho User
type UserProductListResponse struct {
	Code       int                   `json:"code"`
	Message    string                `json:"message,omitempty"`
	Data       []UserProductResponse `json:"data"`
	Pagination *PaginationMeta       `json:"pagination,omitempty"`
}

// UserProductDetailResponse - Chi tiết sản phẩm cho User
type UserProductDetailResponse struct {
	Message          string     `json:"message,omitempty"`
	ID               int64      `json:"id"`
	Name             string     `json:"name"`
	ThumbnailURL     *string    `json:"thumbnail_url,omitempty"`
	ShortDescription *string    `json:"short_description,omitempty"`
	Description      *string    `json:"description,omitempty"`
	Brand            *string    `json:"brand,omitempty"`
	MinPrice         float64    `json:"min_price"`
	PriceOverride    *float64   `json:"price_override,omitempty"`
	DiscountPercent  float64    `json:"discount_percent"`
	FinalPrice       float64    `json:"final_price"`
	AvgRating        float64    `json:"avg_rating"`
	RatingCount      int        `json:"rating_count"`
	PublishedAt      *time.Time `json:"published_at,omitempty"`
	Stock            int        `json:"stock"`

	Categories []Category            `json:"categories,omitempty"`
	Variants   []UserVariantResponse `json:"variants,omitempty"`
	Reviews    []ProductReview       `json:"reviews,omitempty"`
}

// =================================================================
// 4. RESPONSE DTOs - ADMIN (Trả về đầy đủ thông tin cho quản trị viên)
// =================================================================

// AdminProductResponse - Thông tin đầy đủ sản phẩm cho Admin
type AdminProductResponse struct {
	ID               int64                  `json:"id"`
	Name             string                 `json:"name"`
	Slug             string                 `json:"slug"`
	ThumbnailURL     *string                `json:"thumbnail_url,omitempty"`
	ShortDescription *string                `json:"short_description,omitempty"`
	Description      *string                `json:"description,omitempty"`
	Brand            *string                `json:"brand,omitempty"`
	Status           string                 `json:"status"`
	IsPublished      bool                   `json:"is_published"`
	PublishedAt      *time.Time             `json:"published_at,omitempty"`
	MinPrice         float64                `json:"min_price"`
	PriceOverride    *float64               `json:"price_override,omitempty"`
	DiscountPercent  float64                `json:"discount_percent"`
	FinalPrice       float64                `json:"final_price"`
	AvgRating        float64                `json:"avg_rating"`
	RatingCount      int                    `json:"rating_count"`
	CreatedBy        *int64                 `json:"created_by,omitempty"`
	UpdatedBy        *int64                 `json:"updated_by,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
	DeletedAt        *time.Time             `json:"deleted_at,omitempty"`
	Stock            int                    `json:"stock"`
	Categories       []Category             `json:"categories,omitempty"`
	Variants         []AdminVariantResponse `json:"variants,omitempty"`
	Reviews          []ProductReview        `json:"reviews,omitempty"`
}

// AdminProductListResponse - Danh sách sản phẩm cho Admin
type AdminProductListResponse struct {
	Code       int                    `json:"code"`
	Message    string                 `json:"message,omitempty"`
	Data       []AdminProductResponse `json:"data"`
	Pagination *PaginationMeta        `json:"pagination,omitempty"`
}

// AdminProductDetailResponse - Chi tiết sản phẩm cho Admin
type AdminProductDetailResponse struct {
	Code    int                  `json:"code"`
	Message string               `json:"message,omitempty"`
	Data    AdminProductResponse `json:"data"`
}

// AdminImportProductsResponse - Kết quả import file CSV
type AdminImportProductsResponse struct {
	Message      string   `json:"message"`
	TotalCreated int      `json:"total_created"`
	Errors       []string `json:"errors,omitempty"`
}

// AdminCreateProductResponse - Response sau khi tạo sản phẩm mới
type AdminCreateProductResponse struct {
	Code    int                  `json:"code"`
	Message string               `json:"message"`
	Data    AdminProductResponse `json:"data"`
}

// AdminUpdateProductResponse - Response sau khi cập nhật sản phẩm
type AdminUpdateProductResponse struct {
	Code    int                  `json:"code"`
	Message string               `json:"message"`
	Data    AdminProductResponse `json:"data"`
}

// AdminDeleteProductResponse - Response sau khi xóa sản phẩm
type AdminDeleteProductResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

// GetManyProductsResponse - Response trả về nhiều sản phẩm
type GetManyProductsResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data"`
}
