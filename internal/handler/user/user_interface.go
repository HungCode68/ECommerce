package user

import "net/http"

// UserHandler - Interface định nghĩa các hàm xử lý HTTP
type UserHandler interface {
	Register(w http.ResponseWriter, r *http.Request) // Đăng ký tài khoản người dùng

	Login(w http.ResponseWriter, r *http.Request) // Đăng nhập tài khoản người dùng

	GoogleLogin(w http.ResponseWriter, r *http.Request) // Đăng nhập bằng Google

	FacebookLogin(w http.ResponseWriter, r *http.Request) // Đăng nhập bằng Facebook

	SendEmailVerificationOTP(w http.ResponseWriter, r *http.Request) // Gửi OTP xác minh email

	VerifyEmailVerificationOTP(w http.ResponseWriter, r *http.Request) // Xác minh OTP email

	SendForgotPasswordOTP(w http.ResponseWriter, r *http.Request) // Gửi OTP quên mật khẩu

	ResetPassword(w http.ResponseWriter, r *http.Request) // Đặt lại mật khẩu

	Logout(w http.ResponseWriter, r *http.Request) // Đăng xuất tài khoản người dùng

	CreateAdmin(w http.ResponseWriter, r *http.Request) // Tạo tài khoản admin mới

	GetAllUsers(w http.ResponseWriter, r *http.Request) // Lấy tất cả người dùng

	GetUserByID(w http.ResponseWriter, r *http.Request) // Lấy chi tiết người dùng theo ID

	SearchUsers(w http.ResponseWriter, r *http.Request) // Tìm kiếm người dùng

	UpdateUser(w http.ResponseWriter, r *http.Request) // Cập nhật thông tin người dùng theo ID

	UpdateUserProfile(w http.ResponseWriter, r *http.Request) // Cập nhật tài khoản người dùng hiện tại

	ChangePassword(w http.ResponseWriter, r *http.Request) // Đổi mật khẩu

	DeleteMyAccount(w http.ResponseWriter, r *http.Request) // Xoá tài khoản người dùng hiện tại

	// DeleteUserById(w http.ResponseWriter, r *http.Request)		// Xoá người dùng theo ID

	DeleteSoftUsers(w http.ResponseWriter, r *http.Request) // Xoá nhiều người dùng theo danh sách ID

	HardDeleteUsers(w http.ResponseWriter, r *http.Request) // Xóa cứng nhiều người dùng theo danh sách ID

	RestoreSoftUsers(w http.ResponseWriter, r *http.Request) // Bỏ chặn nhiều người dùng theo danh sách ID

	RefreshToken(w http.ResponseWriter, r *http.Request) // Làm mới token
}
