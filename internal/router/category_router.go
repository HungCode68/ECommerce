package router

import (
	"golang/internal/handler"
	"golang/internal/middleware"
	"net/http"
)

func NewCategoryRouter(mux *http.ServeMux, catHandler *handler.CategoryHandler) http.Handler {

	// Lấy danh sách danh mục (Menu - Active Only)
	mux.HandleFunc("GET /api/categories", catHandler.UserGetActiveCategories)

	// Tìm kiếm danh mục (User - Active Only)
	mux.HandleFunc("GET /api/categories/search", catHandler.UserSearchCategories)


	// ADMIN ROUTES (Cần quyền Admin)
	// Lấy tất cả danh mục (All)
	getAllHandler := http.HandlerFunc(catHandler.AdminGetAllCategories)
	mux.Handle("GET /api/admin/categories", middleware.AdminOnlyMiddleware(getAllHandler))

	// Tìm kiếm danh mục (All)
	searchHandler := http.HandlerFunc(catHandler.AdminSearchCategories)
	mux.Handle("GET /api/admin/categories/search", middleware.AdminOnlyMiddleware(searchHandler))

	// Tạo danh mục mới
	createHandler := http.HandlerFunc(catHandler.CreateCategory)
	mux.Handle("POST /api/admin/categories", middleware.AdminOnlyMiddleware(createHandler))

	// Xóa nhiều danh mục cùng lúc
	deleteManyHandler := http.HandlerFunc(catHandler.DeleteManyCategories)
	mux.Handle("DELETE /api/admin/categories", middleware.AdminOnlyMiddleware(deleteManyHandler))

	// Xóa cứng 1 danh mục
	deleteHardHandler := http.HandlerFunc(catHandler.DeleteCategoryHard)
	mux.Handle("DELETE /api/admin/categories/hard/{id}", middleware.AdminOnlyMiddleware(deleteHardHandler))

	// Lấy chi tiết danh mục theo ID (để Admin sửa)
	getByIDHandler := http.HandlerFunc(catHandler.AdminGetCategoryByID)
	mux.Handle("GET /api/admin/categories/{id}", middleware.AdminOnlyMiddleware(getByIDHandler))

	// Cập nhật danh mục
	updateHandler := http.HandlerFunc(catHandler.UpdateCategory)
	mux.Handle("PUT /api/admin/categories/{id}", middleware.AdminOnlyMiddleware(updateHandler))

	// Xóa (ẩn) 1 danh mục
	deleteHandler := http.HandlerFunc(catHandler.DeleteCategory)
	mux.Handle("DELETE /api/admin/categories/{id}", middleware.AdminOnlyMiddleware(deleteHandler))


	return mux
}