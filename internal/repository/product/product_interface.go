package product

import (
	"golang/internal/model"
)

// ProductRepository - Interface định nghĩa các phương thức
type ProductRepository interface {
	// Create & Update
	CreateProduct(product *model.Product, categoryIDs []int64) (*model.Product, error)
	UpdateProduct(product *model.Product, categoryIDs []int64) (*model.Product, error)

	// Check Conflict
	GetConflictProductByName(name string) (bool, error)
	GetConflictProductBySlug(slug string) (bool, error)

	// Read / Get
	GetProductByID(id int64) (*model.Product, error)
	GetProductByName(name string) (*model.Product, error)
	GetProductBySlug(slug string) (*model.Product, error)
	GetManyProduct(ids []int64) ([]model.Product, error)
	GetAllProducts() ([]model.Product, error)
	SearchProducts(req *model.SearchProductsRequest) ([]model.Product, error)
	
	// Helper
	GetCategoriesByProductID(productID int64) ([]model.Category, error)

	// Delete
	DeleteSoftProduct(id int64) error
	BulkDeleteSoftProducts(ids []int64) error
	GetAllProductsSoftDeleted() ([]model.Product, error)
	DeleteAllProductsSoftDeleted() error
	DeleteAllProducts() error
}