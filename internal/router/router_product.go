package router

import (
	"golang/internal/handler/product"
	"golang/internal/middleware"
	"net/http"
)

// NewProductRouter định nghĩa các route cho sản phẩm
func NewProductRouter(mux *http.ServeMux, h product.ProductHandler) http.Handler {

	adminGroup := newGroup(mux, "/admin", middleware.AdminOnlyMiddleware)

	// Nhóm quản lý đơn lẻ
	adminGroup.HandleFunc("POST", "/product", h.CreateProductHandler)                          // Tạo mới
	adminGroup.HandleFunc("GET", "/product/{id}", h.AdminGetProductHandler)                    // Chi tiết (ID)          
	adminGroup.HandleFunc("GET", "/product/all", h.AdminGetAllProductHandler)				  // Lấy tất cả (cả đã xóa mềm)
	adminGroup.HandleFunc("POST", "/products", h.AdminGetManyProductHandler)                  // Lấy nhiều (Active)
	adminGroup.HandleFunc("PUT", "/product/update/{id}", h.UpdateProductHandler)               // Cập nhật
	

	//  Nhóm quản lý nhiều
	adminGroup.HandleFunc("GET", "/product/search", h.AdminSearchProductsHandler)                	 // Tìm kiếm
	adminGroup.HandleFunc("GET", "/products/deleted", h.AdminGetAllSoftDeletedProductsHandler)      // Lấy thùng rác
	adminGroup.HandleFunc("POST", "/products/delesoft", h.AdminBulkDeleteSoftProductsHandler) 		// Xóa mềm 
	adminGroup.HandleFunc("DELETE", "/products/deleall", h.AdminDeleteAllProductsHandler)           // Dọn sạch thùng rác (Hard delete)

	// adminGroup.HandleFunc("GET", "/product/", h.AdminGetProductHandler)
	// adminGroup.HandleFunc("DELETE", "/product/delesoft/{id}", h.AdminDeleteSoftProductHandler)

	// =================================================================
	userGroup := newGroup(mux, "/user")

	// Nhóm xem chi tiết
	userGroup.HandleFunc("GET", "/products/detail/search", h.UserGetProductHandlerDetail)        // Tìm kiếm lấy thông tin chi tiết

	// Nhóm danh sách
	userGroup.HandleFunc("GET", "/products/search", h.UserGetProductHandler) 		// Tìm kiếm 
	userGroup.HandleFunc("GET", "/product/search", h.UserSearchProductHandler)    	// Tìm kiếm

	return mux
}
