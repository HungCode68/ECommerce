package model

import (
	"time"
)

type User struct {
	ID                 int64      `db:"id"`
	Username           string     `db:"username"`
	Email              string     `db:"email"`
	PasswordHash       string     `db:"password_hash"`
	Role               string     `db:"role"`
	IsActive           bool       `db:"is_active"`
	RefreshToken       *string    `db:"refresh_token"`
	RefreshTokenExpiry *time.Time `db:"refresh_token_expiry"`
	CreatedAt          time.Time  `db:"created_at"`
	UpdatedAt          time.Time  `db:"updated_at"`
	DeletedAt          *time.Time `db:"deleted_at"`
}

type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=100,alphanum"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=6,max=30"`
}

// LoginRequest: Dùng khi đăng nhập
type LoginRequest struct {
	// Dùng 1 trường identifier để cho phép nhập username HOẶC email
	Identifier string `json:"identifier" validate:"required,min=3,max=100"`
	Password   string `json:"password"   validate:"required,min=6,max=30"`
}

// Lọc dữ liệu tài khoản
type UserFilter struct {
	Keyword   string 	`validate:"omitempty,max=100"`
	Role      string 	`validate:"omitempty,oneof=admin user"`
	IsActive  *bool  
	IsDeleted *bool 
	Page      int		`validate:"min=1"`
	Limit     int		`validate:"min=1,max=100"`
}

// UserUpdateProfileRequest: Dùng khi user tự cập nhật thông tin cá nhân
type UserUpdateProfileRequest struct {
	Username *string `json:"username,omitempty" validate:"omitempty,min=3,max=100,alphanum"`
	Email    *string `json:"email,omitempty"    validate:"omitempty,email"`
	Password *string `json:"password,omitempty" validate:"omitempty,min=6,max=30"`
}

// AdminUpdateUserRequest: Dùng khi admin cập nhật thông tin user
type AdminUpdateUserRequest struct {
	Role      *string   `json:"role,omitempty"     validate:"omitempty,oneof=user admin"`
	IsActive  *bool     `json:"is_active,omitempty"`
	UpdatedAt time.Time `db:"updated_at,omitempty"`
}

// AdminDeleteManyUsersRequest: Dùng để xóa nhiều user cùng lúc
type AdminDeleteManyUsersRequest struct {
    IDs []int64 `json:"ids" validate:"required,min=1"`
}

// RefreshTokenRequest: Gửi lên Refresh Token cũ để xin cấp mới
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// UserPublicResponse: Dùng cho API công khai (VD: Người review sản phẩm)
type UserPublicResponse struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
}

// UserProfileResponse: Dùng cho User xem và chỉnh sửa profile cá nhân
type UserProfileResponse struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AdminUserResponse: Dùng cho Admin quản lý
type AdminUserResponse struct {
	ID        int64      `json:"id"`
	Username  string     `json:"username"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	IsActive  bool       `json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at"`
}

// LoginResponse: Trả về UserProfileResponse
type LoginResponse struct {
	AccessToken  string              `json:"access_token"`
	RefreshToken string              `json:"refresh_token"`
	User         UserProfileResponse `json:"user"`
}

// RefreshTokenResponse: Trả về cặp token mới toanh
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// APIResponse: Cấu trúc JSON trả về chuẩn cho mọi API
type APIResponse struct {
	Code    int         `json:"code"`             // 200, 400, 500
	Message string      `json:"message"`          // "Success" hoặc thông báo lỗi
	Data    interface{} `json:"data,omitempty"`   // Dữ liệu linh hoạt (User, List, v.v.)
	Errors  interface{} `json:"errors,omitempty"` // Chi tiết lỗi validate (nếu có)
}


