package category

import "net/http"

// CategoryHandler - Interface định nghĩa các hàm xử lý HTTP cho danh mục
type CategoryHandler interface {
	// Admin
	CreateCategory(w http.ResponseWriter, r *http.Request)			// Tạo danh mục mới

	UpdateCategory(w http.ResponseWriter, r *http.Request)			// Cập nhật danh mục

	// DeleteCategory(w http.ResponseWriter, r *http.Request)			// Xoá danh mục mềm

	DeleteSoftCategories(w http.ResponseWriter, r *http.Request)	// Xoá nhiều danh mục mềm

	DeleteCategoryHard(w http.ResponseWriter, r *http.Request)		// Xoá danh mục cứng

	AdminGetAllCategories(w http.ResponseWriter, r *http.Request)	// Lấy tất cả danh mục (kể cả đã xoá mềm)

	AdminGetCategoryByID(w http.ResponseWriter, r *http.Request) 	// Lấy chi tiết danh mục theo ID

	AdminSearchCategories(w http.ResponseWriter, r *http.Request)	// Tìm kiếm danh mục

	// User
	UserGetActiveCategories(w http.ResponseWriter, r *http.Request)	// Lấy danh mục đang hoạt động
	UserSearchCategories(w http.ResponseWriter, r *http.Request)	// Tìm kiếm danh mục đang hoạt động
}