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
	Identifier string `json:"identifier" validate:"required,min=3"`
	Password   string `json:"password"   validate:"required"`
}

// LoginResponse: Cấu trúc trả về khi đăng nhập thành công
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"` 
}

// UpdateProfileRequest: Dùng khi user tự cập nhật thông tin cá nhân
type UpdateProfileRequest struct {
	Username *string `json:"username,omitempty" validate:"omitempty,min=3,max=100,alphanum"`
	Email    *string `json:"email,omitempty"    validate:"omitempty,email"`
	Password *string `json:"password,omitempty" validate:"omitempty,min=6,max=30"`
}

// UpdateUserRequest: Dùng khi cập nhật thông tin
type UpdateUserRequest struct {
	Role      *string   `json:"role,omitempty"     validate:"omitempty,oneof=user admin"`
	IsActive  *bool     `json:"is_active,omitempty"`
	UpdatedAt time.Time `db:"updated_at,omitempty"`
}

// DeleteManyRequest: Dùng để xóa nhiều user cùng lúc
type DeleteManyRequest struct {
    IDs []int64 `json:"ids" validate:"required,min=1"`
}

//GetUserRequest: Dùng để lấy chi tiết user (thường lấy theo ID)
type GetUserRequest struct {
	ID       int64  `json:"id,omitempty" validate:"omitempty,gt=0,numeric"`
	Username string `json:"username,omitempty" validate:"omitempty,min=3"`
	Email    string `json:"email,omitempty"    validate:"omitempty,email"`
}

//UserResponse: Trả về client
type UserResponse struct {
	ID        int64      `json:"id"`
	Username  string     `json:"username"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	IsActive  bool       `json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at"`
}

// APIResponse: Cấu trúc JSON trả về chuẩn cho mọi API
type APIResponse struct {
	Code    int         `json:"code"`             // 200, 400, 500
	Message string      `json:"message"`          // "Success" hoặc thông báo lỗi
	Data    interface{} `json:"data,omitempty"`   // Dữ liệu linh hoạt (User, List, v.v.)
	Errors  interface{} `json:"errors,omitempty"` // Chi tiết lỗi validate (nếu có)
}


// RefreshTokenRequest: Gửi lên Refresh Token cũ để xin cấp mới
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshTokenResponse: Trả về cặp token mới toanh
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}