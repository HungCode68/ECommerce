package category

import (
	"golang/internal/model"
)

// CategoryRepo - Interface định nghĩa các phương thức
type CategoryRepo interface {
	CreateCategory(category *model.Category) (*model.Category, error)
	UpdateCategory(id int64, req model.UpdateCategoryRequest) (*model.Category, error)
	// DeleteCategory(id int64) error
	DeleteSoftCategories(ids []int64) error
	DeleteCategoryHard(id int64) error
	GetCategoryByID(id int64) (*model.Category, error)
	GetAllCategories(req model.AdminGetCategoriesRequest) ([]model.Category, int, error)
	SearchAllCategories(keyword string, isActive *bool) ([]model.Category, error)

	GetActiveCategories() ([]model.Category, error)
	SearchActiveCategories(keyword string) ([]model.Category, error)

	CountProductsByCategoryID(categoryID int64) (int, error)
	CheckSlugExist(slug string) (bool, error)
}