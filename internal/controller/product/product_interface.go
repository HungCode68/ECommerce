package product

import (
	"context"
	"golang/internal/model"
)

// ProductController - Interface định nghĩa các nghiệp vụ sản phẩm
type ProductController interface {
	// Create & Update
	// tạo mới sản phẩm
	CreateProductController(adminID int64, product model.CreateProductRequest) (*model.AdminCreateProductResponse, error)
	
	// Nhập sản phẩm hàng loạt (CSV)
	AdminImportProductsController(adminID int64, reqs []model.CreateProductRequest) (*model.AdminImportProductsResponse, error)

	// Cập nhật sản phẩm
	UpdateProductController(ctx context.Context,req model.UpdateProductRequest, id int64) (*model.AdminUpdateProductResponse, error)

	// Admin Get Logic
	// Lấy chi tiết sản phẩm theo ID
	AdminGetProductController(reqProduct *model.GetProductRequest) (*model.AdminProductDetailResponse, error)

	// Lấy tất cả sản phẩm
	AdminGetAllProductsController(req *model.SearchProductsRequest) (*model.AdminProductListResponse, error)

	// Lấy nhiều sản phẩm theo danh sách ID
	AdminGetManyProductByIDController(ids []int64) ([]model.AdminProductResponse, error)

	// tìm kiếm sản phẩm
	AdminSearchProductsController(req *model.SearchProductsRequest) (*model.AdminProductListResponse, error)
	
	// User Get Logic
	// Lấy chi tiết sản phẩm theo ID
	UserGetProductDetailController(reqProduct *model.GetProductRequest) (*model.UserProductDetailResponse, error)

	// Lấy tất cả sản phẩm
	UserGetAllProductsController(req *model.SearchProductsRequest) (*model.UserProductListResponse, error)

	// Lấy sản phẩm theo slug
	UserGetProductController(reqProduct *model.GetProductRequest) (*model.UserProductResponse, error)

	// Tìm kiếm sản phẩm
	UserSearchProductByNameController(req *model.SearchProductsRequest) (*model.UserProductListResponse, error)

	// Delete / Restore Logic
	// Xóa mềm sản phẩm
	AdminDeleteSoftProductController(adminID int64, id int64) error

	// lây tất cả sản phẩm đã xóa mềm
	AdminGetAllSoftDeletedProductsController() (*model.AdminProductListResponse, error)

	// Xóa mềm nhiều sản phẩm theo danh sách ID
	AdminBulkDeleteSoftProductsController(adminID int64, ids []int64) error

	// Xóa mềm TẤT CẢ sản phẩm đang hoạt động (Dùng cẩn thận!)
	AdminDeleteAllActiveProductsController(adminID int64) error
	
	// Xóa cứng tất cả sản phẩm
	AdminDeleteAllProductsController(adminID int64) error

	// Khôi phục sản phẩm đã xóa mềm
	AdminRestoreProductsController(adminID int64, ids []int64) error

	// Xóa vĩnh viễn sản phẩm đã xóa mềm
	AdminDeleteHardProductsController(adminID int64, ids []int64) error
}