package model

import "time"

// =================================================================
// 1. PRODUCT MODEL (Ánh xạ CSDL)
// =================================================================

// Product ánh xạ trực tiếp với bảng 'products' trong CSDL
type Product struct {
	ID               int64   `db:"id"`
	Name             string  `db:"name"`
	Slug             string  `db:"slug"`
	ShortDescription *string `db:"short_description"` // Có thể NULL
	Description      *string `db:"description"`       // Có thể NULL
	Brand            *string `db:"brand"`             // Có thể NULL
	Status           string  `db:"status"`
	IsPublished      bool    `db:"is_published"`

	PublishedAt *time.Time `db:"published_at"` // Có thể NULL

	MinPrice    float64 `db:"min_price"`
	AvgRating   float64 `db:"avg_rating"`
	RatingCount int     `db:"rating_count"`
	CreatedBy   *int64  `db:"created_by"` // Có thể NULL
	UpdatedBy   *int64  `db:"updated_by"` // Có thể NULL

	CreatedAt time.Time  `db:"created_at"`
	UpdatedAt time.Time  `db:"updated_at"`
	DeletedAt *time.Time `db:"deleted_at"` // Có thể NULL
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
	Name             string  `json:"name" validate:"required,min=3,max=255"`
	Slug             string  `json:"slug" validate:"required,min=3,max=255"`
	MinPrice         float64 `json:"min_price" validate:"required,gt=0"`
	ShortDescription string  `json:"short_description" validate:"omitempty,max=500"`
	Description      string  `json:"description" validate:"omitempty"`
	Brand            string  `json:"brand" validate:"omitempty,max=100"`
	Status           string  `json:"status" validate:"omitempty,oneof=draft active inactive archived"`
	IsPublished      bool    `json:"is_published"`
	PublishedAt      string  `json:"published_at" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
}

// UpdateProductRequest dùng cho việc cập nhật sản phẩm (Admin)
type UpdateProductRequest struct {
	Name             string   `json:"name" validate:"omitempty,min=3,max=255"`
	Slug             string   `json:"slug" validate:"omitempty,min=3,max=255"`
	MinPrice         *float64 `json:"min_price" validate:"omitempty,min=0"`
	ShortDescription string   `json:"short_description" validate:"omitempty,max=500"`
	Description      string   `json:"description" validate:"omitempty"`
	Brand            string   `json:"brand" validate:"omitempty,max=100"`
	Status           string   `json:"status" validate:"omitempty,oneof=draft active inactive archived"`
	IsPublished      *bool    `json:"is_published"`
	PublishedAt      string   `json:"published_at" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
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

// SearchProductsRequest - Tìm kiếm sản phẩm đơn giản
type SearchProductsRequest struct {
	Search string `json:"search" validate:"omitempty,max=255"`

	Brand string `json:"brand" validate:"omitempty,max=100"`
}

// =================================================================
// 3. RESPONSE DTOs - USER (Trả về cho khách hàng)
// =================================================================

// UserProductResponse - Thông tin sản phẩm cho User
type UserProductResponse struct {
	ID       int64                 `json:"id"`
	Name     string                `json:"name"`
	Brand    *string               `json:"brand,omitempty"`
	MinPrice float64               `json:"min_price"`
	Variants []UserVariantResponse `json:"variants"`
}

// UserProductListResponse - Danh sách sản phẩm cho User
type UserProductListResponse struct {
	Message  string                `json:"message,omitempty"`
	Products []UserProductResponse `json:"products"`
}

// UserProductDetailResponse - Chi tiết sản phẩm cho User
type UserProductDetailResponse struct {
	Message          string     `json:"message,omitempty"`
	ID               int64      `json:"id"`
	Name             string     `json:"name"`
	ShortDescription *string    `json:"short_description,omitempty"`
	Description      *string    `json:"description,omitempty"`
	Brand            *string    `json:"brand,omitempty"`
	MinPrice         float64    `json:"min_price"`
	AvgRating        float64    `json:"avg_rating"`
	RatingCount      int        `json:"rating_count"`
	PublishedAt      *time.Time `json:"published_at,omitempty"`
}

// =================================================================
// 4. RESPONSE DTOs - ADMIN (Trả về đầy đủ thông tin cho quản trị viên)
// =================================================================

// AdminProductResponse - Thông tin đầy đủ sản phẩm cho Admin
type AdminProductResponse struct {
	ID               int64      `json:"id"`
	Name             string     `json:"name"`
	Slug             string     `json:"slug"`
	ShortDescription *string    `json:"short_description,omitempty"`
	Description      *string    `json:"description,omitempty"`
	Brand            *string    `json:"brand,omitempty"`
	Status           string     `json:"status"`
	IsPublished      bool       `json:"is_published"`
	PublishedAt      *time.Time `json:"published_at,omitempty"`
	MinPrice         float64    `json:"min_price"`
	AvgRating        float64    `json:"avg_rating"`
	RatingCount      int        `json:"rating_count"`
	CreatedBy        *int64     `json:"created_by,omitempty"`
	UpdatedBy        *int64     `json:"updated_by,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}

// AdminProductListResponse - Danh sách sản phẩm cho Admin
type AdminProductListResponse struct {
	Message  string                 `json:"message,omitempty"`
	Products []AdminProductResponse `json:"products"`
}

// AdminProductDetailResponse - Chi tiết sản phẩm cho Admin
type AdminProductDetailResponse struct {
	Message string               `json:"message,omitempty"`
	Product AdminProductResponse `json:"product"`
}

// AdminCreateProductResponse - Response sau khi tạo sản phẩm mới
type AdminCreateProductResponse struct {
	Message string               `json:"message"`
	Product AdminProductResponse `json:"product"`
}

// AdminUpdateProductResponse - Response sau khi cập nhật sản phẩm
type AdminUpdateProductResponse struct {
	Message string               `json:"message"`
	Product AdminProductResponse `json:"product"`
}

// AdminDeleteProductResponse - Response sau khi xóa sản phẩm
type AdminDeleteProductResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

// AdminBulkDeleteProductResponse - Response sau khi xóa nhiều sản phẩm
type AdminBulkDeleteProductResponse struct {
	Message      string  `json:"message"`
	DeletedCount int     `json:"deleted_count"`
	FailedIDs    []int64 `json:"failed_ids,omitempty"`
	Success      bool    `json:"success"`
}

// GetManyProductsResponse - Response trả về nhiều sản phẩm
type GetManyProductsResponse struct {
	Message  string                `json:"message,omitempty"`
	Products []UserProductResponse `json:"products"`
}
