package router

import (
	"golang/internal/handler/user"
	"golang/internal/middleware"
	"net/http"
)

func NewUserRouter(mux *http.ServeMux, userHandler user.UserHandler) http.Handler {
	authGroup := newGroup(mux, "/api/auth")

	authGroup.HandleFunc("POST", "/register", userHandler.Register)
	authGroup.HandleFunc("POST", "/login", userHandler.Login)
	authGroup.HandleFunc("POST", "/refresh", userHandler.RefreshToken)

	// =================================================================
	userGroup := newGroup(mux, "/api", middleware.AuthMiddleware)

	userGroup.HandleFunc("POST", "/auth/logout", userHandler.Logout)         // Logout
	userGroup.HandleFunc("PUT", "/users/me", userHandler.UpdateUserProfile)  // Cập nhật profile
	userGroup.HandleFunc("DELETE", "/users/me", userHandler.DeleteMyAccount) // Xoá tài khoản cá nhân

	// =================================================================
	adminGroup := newGroup(mux, "/api/admin/users", middleware.AdminOnlyMiddleware)

	adminGroup.HandleFunc("GET", "", userHandler.GetAllUsers)            // Lấy tất cả users
	adminGroup.HandleFunc("GET", "/search", userHandler.SearchUsers)     // Tìm kiếm users
	adminGroup.HandleFunc("GET", "/{id}", userHandler.GetUserByID)       // Lấy user by ID
	adminGroup.HandleFunc("POST", "", userHandler.CreateAdmin)           // Tạo mới admin
	adminGroup.HandleFunc("DELETE", "", userHandler.DeleteSoftUsers)     // Xóa users
	adminGroup.HandleFunc("PUT", "/{id}", userHandler.UpdateUser)        // Cập nhật user by ID
	// adminGroup.HandleFunc("DELETE", "/{id}", userHandler.DeleteUserById) // Xóa user by ID

	return mux
}
