package product

import "net/http"

// ProductHandler - Interface định nghĩa các hàm xử lý HTTP cho sản phẩm
type ProductHandler interface {
	// Create & Update
	CreateProductHandler(w http.ResponseWriter, r *http.Request) 		// Tạo sản phẩm mới
	UpdateProductHandler(w http.ResponseWriter, r *http.Request) 		// Cập nhật sản phẩm

	// Get Details
	AdminGetProductHandler(w http.ResponseWriter, r *http.Request) 		// Lấy chi tiết sản phẩm theo ID (Admin)
	UserGetProductHandlerDetail(w http.ResponseWriter, r *http.Request) // Lấy chi tiết sản phẩm theo ID (User)
	UserGetProductHandler(w http.ResponseWriter, r *http.Request)		// Lấy sản phẩm theo slug (User)

	// Search & List
	UserSearchProductHandler(w http.ResponseWriter, r *http.Request)		// Tìm kiếm sản phẩm (User)
	AdminSearchProductsHandler(w http.ResponseWriter, r *http.Request)		// Tìm kiếm sản phẩm (Admin)
	AdminGetAllProductHandler(w http.ResponseWriter, r *http.Request)		// Lấy tất cả sản phẩm (Admin)
	
	AdminGetManyProductHandler(w http.ResponseWriter, r *http.Request)	// Lấy nhiều sản phẩm theo danh sách ID (Admin)

	// Delete
	AdminDeleteSoftProductHandler(w http.ResponseWriter, r *http.Request) 		// Xóa mềm sản phẩm
	AdminBulkDeleteSoftProductsHandler(w http.ResponseWriter, r *http.Request)	// Xóa mềm nhiều sản phẩm
	AdminGetAllSoftDeletedProductsHandler(w http.ResponseWriter, r *http.Request)	// Lấy tất cả sản phẩm đã xóa mềm 
	AdminDeleteAllProductsHandler(w http.ResponseWriter, r *http.Request)			// Xóa cứng tất cả sản phẩm
}