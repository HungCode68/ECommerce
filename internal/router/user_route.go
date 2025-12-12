package router

import (
	"net/http"
	"golang/internal/handler"
	"golang/internal/middleware"
)

func NewUserRouter(mux *http.ServeMux ,userHandler *handler.UserHandler) http.Handler {
	
	
	// Đăng ký tài khoản thường
	mux.HandleFunc("POST /api/auth/register", userHandler.Register)
	
	// Đăng nhập
	mux.HandleFunc("POST /api/auth/login", userHandler.Login)

	// Refresh Token
	mux.HandleFunc("POST /api/auth/refresh", userHandler.RefreshToken)

	// Đăng xuất
	logoutHandler := http.HandlerFunc(userHandler.Logout)
    mux.Handle("POST /api/auth/logout", middleware.AuthMiddleware(logoutHandler))

	// User tự cập nhật thông tin: PUT /api/v1/users/me
    updateProfileHandler := http.HandlerFunc(userHandler.UpdateUserProfile)
    mux.Handle("PUT /api/users/me", middleware.AuthMiddleware(updateProfileHandler))

    // User tự xóa tài khoản: DELETE /api/users/me
    deleteMyAccountHandler := http.HandlerFunc(userHandler.DeleteMyAccount)
    mux.Handle("DELETE /api/users/me", middleware.AuthMiddleware(deleteMyAccountHandler))


	// ------- Admin routes -------
	// Lấy danh sách user
	getAllHandler := http.HandlerFunc(userHandler.GetAllUsers)
	mux.Handle("GET /api/admin/users", middleware.AdminOnlyMiddleware(getAllHandler))

	// Tìm kiếm user
	searchHandler := http.HandlerFunc(userHandler.SearchUsers)
	mux.Handle("GET /api/admin/users/search", middleware.AdminOnlyMiddleware(searchHandler))

	// Xem chi tiết user bất kỳ
	getByIDHandler := http.HandlerFunc(userHandler.GetUserByID)
	mux.Handle("GET /api/admin/users/{id}", middleware.AdminOnlyMiddleware(getByIDHandler))

	// Tạo Admin mới: POST /api/admin/users
	createAdminHandler := http.HandlerFunc(userHandler.CreateAdmin)
	mux.Handle("POST /api/admin/users", middleware.AdminOnlyMiddleware(createAdminHandler))

	// Xóa nhiều User: DELETE /api/admin/users
	deleteManyHandler := http.HandlerFunc(userHandler.DeleteManyUsers)
	mux.Handle("DELETE /api/admin/users", middleware.AdminOnlyMiddleware(deleteManyHandler))

	// Cập nhật thông tin User: PUT /api/users/{id}
	updateUserHandler := http.HandlerFunc(userHandler.UpdateUser)
	mux.Handle("PUT /api/admin/users/{id}", middleware.AdminOnlyMiddleware(updateUserHandler))

	// Xóa 1 User: DELETE /api/users/{id}
	deleteUserHandler := http.HandlerFunc(userHandler.DeleteUserById)
	mux.Handle("DELETE /api/admin/users/{id}", middleware.AdminOnlyMiddleware(deleteUserHandler))

	return mux
}