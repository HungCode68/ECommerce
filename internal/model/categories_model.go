package model

import "time"

// CATEGORY ENTITY (Ánh xạ bảng categories)

type Category struct {
	ID          int64     `db:"id"`
	Name        string    `db:"name"`
	Slug        string    `db:"slug"`
	Description *string   `db:"description"` 
	IsActive    bool      `db:"is_active"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}


// CreateCategoryRequest: Dùng khi tạo mới danh mục
type CreateCategoryRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Slug        string  `json:"slug" validate:"omitempty,min=2,max=100"` 
	Description string  `json:"description" validate:"omitempty,max=500"`
	IsActive    *bool   `json:"is_active,omitempty"` 
}

// UpdateCategoryRequest: Dùng khi cập nhật danh mục (Partial Update)
type UpdateCategoryRequest struct {
	Name        *string `json:"name,omitempty"        validate:"omitempty,min=2,max=100"`
	Slug        *string `json:"slug,omitempty"        validate:"omitempty,min=2,max=100"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
	IsActive    *bool   `json:"is_active,omitempty"`
	UpdatedAt   time.Time `db:"updated_at,omitempty"`
}

// DeleteManyCategoriesRequest: Dùng để xóa nhiều danh mục cùng lúc
type DeleteManyCategoriesRequest struct {
	IDs []int64 `json:"ids" validate:"required,min=1"`
}

// GetCategoryRequest: Dùng để tìm kiếm/lọc danh mục
type GetCategoryRequest struct {
	ID   int64  `json:"id,omitempty"   validate:"omitempty,gt=0"`
	Name string `json:"name,omitempty" validate:"omitempty,min=1"`
	Slug string `json:"slug,omitempty" validate:"omitempty,min=1"`
}

// AdminGetCategoriesRequest: Chỉ dùng cho việc phân trang
type AdminGetCategoriesRequest struct {
	Page  int `json:"page"  validate:"min=1"`
	Limit int `json:"limit" validate:"min=1,max=100"`
}


// CategoryResponse
type AdminCategoryResponse struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description *string   `json:"description,omitempty"` 
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CategoryListResponse: Trả về danh sách danh mục (bọc trong Data của APIResponse)
type AdminCategoryListResponse struct {
	Message    string             `json:"message,omitempty"`
	Categories []AdminCategoryResponse `json:"categories"`
}

type UserCategoryResponse struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Response cho danh sách User (Menu)
type UserCategoryListResponse struct {
	Categories []UserCategoryResponse `json:"categories"`
}