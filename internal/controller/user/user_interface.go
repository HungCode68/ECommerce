package user

import "golang/internal/model"

// UserController - Interface định nghĩa các nghiệp vụ (Logic)
type UserController interface {
	// Đăng ký người dùng mới
	Register(req model.RegisterRequest) (model.UserProfileResponse, error)

	// Đăng nhập người dùng
	Login(req model.LoginRequest) (model.LoginResponse, error)

	// Đăng xuất người dùng
	Logout(userID int64) error

	// Tạo tài khoản admin mới
	CreateAdmin(req model.RegisterRequest) (model.AdminUserResponse, error)

	// Lấy tất cả người dùng
	GetAllUsers() ([]model.AdminUserResponse, error)

	// Lấy chi tiết người dùng theo ID
	GetUserByID(id int64) (model.AdminUserResponse, error)

	// Tìm kiếm người dùng
	SearchUsers(keyword string) ([]model.AdminUserResponse, error)

	// Cập nhật thông tin người dùng theo ID
	UpdateUser(id int64, req model.AdminUpdateUserRequest) (model.AdminUserResponse, error)

	// Cập nhật tài khoản người dùng hiện tại
	UpdateUserProfile(id int64, req model.UserUpdateProfileRequest) (model.UserProfileResponse, error)

	// Xoá tài khoản người dùng hiện tại
	DeleteMyAccount(id int64) error

	// Xoá người dùng theo ID
	// DeleteUserById(id int64) error

	// Xoá nhiều người dùng theo danh sách ID
	DeleteSoftUsers(req model.AdminDeleteManyUsersRequest) error

	// Làm mới token
	RefreshToken(req model.RefreshTokenRequest) (model.RefreshTokenResponse, error)
}