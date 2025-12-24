package product

import (
	"context"
	"golang/internal/model"
)

// ProductController - Interface định nghĩa các nghiệp vụ sản phẩm
type ProductController interface {
	// Create & Update
	// tạo mới sản phẩm
	CreateProductController(product model.CreateProductRequest) (*model.AdminCreateProductResponse, error)

	// Cập nhật sản phẩm
	UpdateProductController(ctx context.Context,req model.UpdateProductRequest, id int64) (*model.AdminUpdateProductResponse, error)

	// Admin Get Logic
	// Lấy chi tiết sản phẩm theo ID
	AdminGetProductController(reqProduct *model.GetProductRequest) (*model.AdminProductDetailResponse, error)

	// Lấy tất cả sản phẩm
	AdminGetAllProductsController() (*model.AdminProductListResponse, error)

	// Lấy nhiều sản phẩm theo danh sách ID
	AdminGetManyProductByIDController(ids []int64) ([]model.AdminProductResponse, error)

	// tìm kiếm sản phẩm
	AdminSearchProductsController(req *model.SearchProductsRequest) (*model.AdminProductListResponse, error)
	
	// User Get Logic
	// Lấy chi tiết sản phẩm theo ID
	UserGetProductDetailController(reqProduct *model.GetProductRequest) (*model.UserProductDetailResponse, error)

	// Lấy tất cả sản phẩm
	UserGetAllProductsController() (*model.UserProductListResponse, error)

	// Lấy sản phẩm theo slug
	UserGetProductController(reqProduct *model.GetProductRequest) (*model.UserProductResponse, error)

	// Tìm kiếm sản phẩm
	UserSearchProductByNameController(req *model.SearchProductsRequest) (*model.UserProductListResponse, error)

	// Delete / Restore Logic
	// Xóa mềm sản phẩm
	AdminDeleteSoftProductController(id int64) error

	// lây tất cả sản phẩm đã xóa mềm
	AdminGetAllSoftDeletedProductsController() (*model.AdminProductListResponse, error)

	// Xóa mềm nhiều sản phẩm
	AdminDeleteAllSoftDeletedProductsController() error
	
	// Xóa cứng tất cả sản phẩm
	AdminDeleteAllProductsController() error
}