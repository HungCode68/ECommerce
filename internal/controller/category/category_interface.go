package category

import "golang/internal/model"

// CategoryController - Interface định nghĩa các nghiệp vụ danh mục
type CategoryController interface {
	// Admin Methods
	// tạo mới danh mục
	CreateCategory(req model.CreateCategoryRequest) (model.AdminCategoryResponse, error)

	// Cập nhật danh mục
	UpdateCategory(id int64, req model.UpdateCategoryRequest) (model.AdminCategoryResponse, error)

	// Xoá danh mục mềm
	// DeleteCategory(id int64) error

	// Xoá nhiều danh mục mềm
	DeleteSoftCategories(req model.DeleteManyCategoriesRequest) error

	// Xoá danh mục cứng
	DeleteCategoryHard(id int64) error

	// Lấy tất cả danh mục (kể cả đã xoá mềm)
	AdminGetAllCategories() ([]model.AdminCategoryResponse, error)

	// Lấy chi tiết danh mục theo ID
	AdminGetCategoryByID(id int64) (model.AdminCategoryResponse, error)

	// Tìm kiếm danh mục
	AdminSearchCategories(keyword string) ([]model.AdminCategoryResponse, error)

	// User Methods
	// Lấy danh mục đang hoạt động
	UserGetActiveCategories() ([]model.UserCategoryResponse, error)

	// Tìm kiếm danh mục đang hoạt động
	UserSearchCategories(keyword string) ([]model.UserCategoryResponse, error)
}