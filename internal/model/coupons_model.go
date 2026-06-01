package model

const (
	CouponDiscountTypePercentage         = "percentage"
	CouponDiscountTypeFixedAmount        = "fixed_amount"
	CouponDiscountTypeShippingPercentage = "shipping_percentage"
	CouponDiscountTypeShippingFixed      = "shipping_fixed"
)

type Coupons struct {
	ID                int64    `db:"id"`
	Code              string   `db:"code"`
	Description       *string  `db:"description"`
	DiscountType      *string  `db:"discount_type"`
	DiscountValue     *float64 `db:"discount_value"`
	MinOrderValue     *float64 `db:"min_order_value"`
	MaxDiscountAmount *float64 `db:"max_discount_amount"`
	UsageLimit        *int64   `db:"usage_limit"`
	UsageCount        *int64   `db:"usage_count"`
	UserUsageLimit    *int64   `db:"user_usage_limit"`
	UseUsageLimit     *bool    `db:"use_usage_limit"`
	IsActive          bool     `db:"is_active"`
	StartDate         *string  `db:"start_date"`
	EndDate           *string  `db:"end_date"`

	CreatedAt string `db:"created_at"`
	UpdatedAt string `db:"updated_at"`
}

// DTOs API nhận vào và trả về
type CreateCouponRequest struct {
	Code              string   `json:"code" validate:"required,min=3,max=50"`
	Description       *string  `json:"description" validate:"required,max=255"`
	DiscountType      *string  `json:"discount_type" validate:"required,oneof=percentage fixed_amount shipping_percentage shipping_fixed"`
	DiscountValue     *float64 `json:"discount_value" validate:"required,gt=0"`
	MinOrderValue     *float64 `json:"min_order_value" validate:"omitempty,gt=0"`
	MaxDiscountAmount *float64 `json:"max_discount_amount" validate:"omitempty,gt=0"`
	UsageLimit        *int64   `json:"usage_limit" validate:"omitempty,gt=0"`
	UserUsageLimit    *int64   `json:"user_usage_limit" validate:"omitempty,gt=0"`
	UseUsageLimit     *bool    `json:"use_usage_limit" validate:"omitempty"`
	IsActive          bool     `json:"is_active"`
	StartDate         *string  `json:"start_date"`
	EndDate           *string  `json:"end_date"`
}

type UpdateCouponRequest struct {
	Code         string  `json:"code" validate:"required,min=3,max=50"`
	Description  *string `json:"description" validate:"required,max=255"`
	DiscountType *string `json:"discount_type" validate:"required,oneof=percentage fixed_amount shipping_percentage shipping_fixed"`
	DiscountValue *float64 `json:"discount_value" validate:"required,gt=0"`

	MinOrderValue     *float64 `json:"min_order_value" validate:"omitempty,gt=0"`
	MaxDiscountAmount *float64 `json:"max_discount_amount" validate:"omitempty,gt=0"`
	UsageLimit        *int64   `json:"usage_limit" validate:"omitempty,gt=0"`
	UserUsageLimit    *int64   `json:"user_usage_limit" validate:"omitempty,gt=0"`
	UseUsageLimit     *bool    `json:"use_usage_limit" validate:"omitempty"`
	IsActive          bool     `json:"is_active"`
	StartDate         *string  `json:"start_date"`
	EndDate           *string  `json:"end_date"`
}

type DeleteCouponRequest struct {
	ID int64 `json:"id"`
}

type BulkDeleteCouponsRequest struct {
	IDs []int64 `json:"ids" validate:"required,min=1,dive,gt=0"`
}

type AvailableCouponResponse struct {
	Code              string   `json:"code"`
	Description       *string  `json:"description"`
	DiscountType      *string  `json:"discount_type"`
	DiscountValue     *float64 `json:"discount_value"`
	MinOrderValue     *float64 `json:"min_order_value"`
	MaxDiscountAmount *float64 `json:"max_discount_amount"`
	StartDate         *string  `json:"start_date"`
	EndDate           *string  `json:"end_date"`
}

type CouponResponse struct {
	ID            int64    `json:"id"`
	Code          string   `json:"code"`
	Description   *string  `json:"description"`
	DiscountType  *string  `json:"discount_type"`
	DiscountValue *float64 `json:"discount_value"`

	MinOrderValue     *float64 `json:"min_order_value"`
	MaxDiscountAmount *float64 `json:"max_discount_amount"`
	UsageLimit        *int64   `json:"usage_limit"`
	UsageCount        *int64   `json:"usage_count"`
	UserUsageLimit    *int64   `json:"user_usage_limit"`
	UseUsageLimit     *bool    `json:"use_usage_limit"`
	IsActive          bool     `json:"is_active"`
	StartDate         *string  `json:"start_date"`
	EndDate           *string  `json:"end_date"`
	CreatedAt         string   `json:"created_at"`
	UpdatedAt         string   `json:"updated_at"`
}

type GetCouponsAdminRequest struct {
	Page   int    `json:"page" validate:"min=1"`
	Limit  int    `json:"limit" validate:"min=1,max=100"`
	Search string `json:"search"`
	Status string `json:"status" validate:"omitempty,oneof=active inactive expired"`
}
type GetAllCouponsRequest struct {
	Search string `json:"search"`
}
type GetManyCouponsRequest struct {
	IDs []int64 `json:"ids" validate:"required,min=1,dive,gt=0"`
}

// Response — server trả về
type CouponListResponse struct {
	Data       []CouponResponse `json:"data"`
	Total      int64            `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
}

//DTOs use case áp dụng coupon cho đơn hàng

type ApplyCouponRequest struct {
	Code        string  `json:"code" validate:"required,min=3,max=50"`
	UserID      int64   `json:"user_id" validate:"required"`
	OrderAmount float64 `json:"order_amount" validate:"required,gt=0"`
}

type ApplyCouponResponse struct {
	CouponID       int64   `json:"coupon_id"`
	Code           string  `json:"code"`
	DiscountType   string  `json:"discount_type"`
	DiscountAmount float64 `json:"discount_amount"` // Số tiền được giảm thực tế
	FinalAmount    float64 `json:"final_amount"`    // Tổng tiền sau khi giảm
}

// Lịch sử dùng coupon của user
type CouponUsage struct {
	ID       int64  `db:"id"`
	CouponID int64  `db:"coupon_id"`
	UserID   int64  `db:"user_id"`
	OrderID  int64  `db:"order_id"`
	UsedAt   string `db:"used_at"`
}
type GetAvailableCouponsRequest struct {
	UserID      int64   `json:"user_id" validate:"required"`
	OrderAmount float64 `json:"order_amount" validate:"required,gt=0"`
}

// Validate coupon trước khi checkout (chưa apply)
type ValidateCouponRequest struct {
	Code        string  `json:"code" validate:"required"`
	UserID      int64   `json:"user_id" validate:"required"`
	OrderAmount float64 `json:"order_amount" validate:"required,gt=0"`
}

type ValidateCouponResponse struct {
	IsValid        bool    `json:"is_valid"`
	CouponID       int64   `json:"coupon_id"`
	Message        string  `json:"message"` // Lý do nếu không hợp lệ
	DiscountAmount float64 `json:"discount_amount"`
	FinalAmount    float64 `json:"final_amount"`
}
