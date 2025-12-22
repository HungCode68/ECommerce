package router

import (
	"golang/internal/handler/category"
	"golang/internal/middleware"
	"net/http"
)

func NewCategoryRouter(mux *http.ServeMux, catHandler category.CategoryHandler) http.Handler {
	publicGroup := newGroup(mux, "/api/categories")

	publicGroup.HandleFunc("GET", "", catHandler.UserGetActiveCategories)     // Lấy danh sách danh mục (Active)
	publicGroup.HandleFunc("GET", "/search", catHandler.UserSearchCategories) // Tìm kiếm (Active)

	// =================================================================
	adminGroup := newGroup(mux, "/api/admin/categories", middleware.AdminOnlyMiddleware)

	// Các chức năng quản lý
	adminGroup.HandleFunc("GET", "", catHandler.AdminGetAllCategories)        // Lấy tất cả danh mục (Cả ẩn)
	adminGroup.HandleFunc("GET", "/search", catHandler.AdminSearchCategories) // Tìm kiếm (Cả ẩn)
	adminGroup.HandleFunc("POST", "", catHandler.CreateCategory)              // Tạo mới danh mục
	adminGroup.HandleFunc("DELETE", "", catHandler.DeleteSoftCategories)          // Xóa danh mục

	// Các chức năng theo ID
	adminGroup.HandleFunc("GET", "/{id}", catHandler.AdminGetCategoryByID) // Xem chi tiết danh mục
	adminGroup.HandleFunc("PUT", "/{id}", catHandler.UpdateCategory)       // Cập nhật
	// adminGroup.HandleFunc("DELETE", "/{id}", catHandler.DeleteCategory)    // Xóa mềm (Ẩn)

	// Chức năng nâng cao
	adminGroup.HandleFunc("DELETE", "/hard/{id}", catHandler.DeleteCategoryHard) // Xóa cứng (Vĩnh viễn)

	return mux
}
