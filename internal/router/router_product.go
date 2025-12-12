package router

import (
	"golang/internal/handler"
	"net/http"
)

func RegisterProductRoutes(mux *http.ServeMux, h *handler.ProductHandler) {
	// =====================================================================
	// ADMIN ROUTES - Quản lý sản phẩm (đầy đủ quyền)
	// =====================================================================

	// Tạo sản phẩm mới - Kiểm tra trùng lặp tên và slug
	mux.HandleFunc("POST /admin/product", h.CreateProductHandler)

	// Lấy chi tiết sản phẩm theo tên (query parameter ?name=xxx)
	mux.HandleFunc("GET /admin/product/", h.AdminGetProductHandler)

	// Lấy chi tiết sản phẩm theo ID
	mux.HandleFunc("GET /admin/product/{id}", h.AdminGetProductHandler)

	// Lấy chi tiết sản phẩm theo slug (đường dẫn thân thiện)
	mux.HandleFunc("GET /admin/product/slug/{slug}", h.AdminGetProductHandler)

	// Lấy tất cả sản phẩm (không bao gồm đã xóa mềm)
	mux.HandleFunc("GET /admin/product/all", h.AdminGetAllProductHandler)

	// Lấy nhiều sản phẩm theo danh sách IDs (body: {"ids": [1,2,3]})
	mux.HandleFunc("POST /admin/products/many", h.AdminGetManyProductController)

	// Tìm kiếm sản phẩm theo tên (LIKE) hoặc thương hiệu (exact match)
	mux.HandleFunc("POST /admin/products/search", h.AdminSearchProductsHandler)

	// Cập nhật thông tin sản phẩm
	mux.HandleFunc("PUT /admin/product/update/{id}", h.UpdateProductHandler)

	// Xóa mềm sản phẩm đơn (set deleted_at)
	mux.HandleFunc("DELETE /admin/product/delesoft/{id}", h.AdminDeleteSoftProductHandler)

	// Lấy danh sách tất cả sản phẩm đã xóa mềm
	mux.HandleFunc("GET /admin/products/deleted", h.AdminGetAllSoftDeletedProductsHandler)

	// Xóa mềm nhiều sản phẩm cùng lúc (body: {"ids": [1,2,3]})
	mux.HandleFunc("POST /admin/products/delesoft/multi", h.AdminBulkDeleteSoftProductsHandler)

	// Xóa vĩnh viễn tất cả sản phẩm đã xóa mềm (hard delete)
	mux.HandleFunc("DELETE /admin/products/deleall", h.AdminDeleteAllProductsHandler)

	// =====================================================================
	// USER ROUTES - Xem sản phẩm (chỉ sản phẩm đã publish)
	// =====================================================================

	// Lấy chi tiết đầy đủ sản phẩm theo tên (query ?name=xxx) - Chỉ published
	mux.HandleFunc("GET /user/products/detail/", h.UserGetProductHandlerDetail)

	// Lấy chi tiết đầy đủ sản phẩm theo ID - Chỉ published
	mux.HandleFunc("GET /user/product/detail/{id}", h.UserGetProductHandlerDetail)

	// Lấy chi tiết đầy đủ sản phẩm theo slug - Chỉ published
	mux.HandleFunc("GET /user/product/detail/slug/{slug}", h.UserGetProductHandlerDetail)

	// Lấy thông tin rút gọn sản phẩm theo tên (query ?name=xxx) - Chỉ published
	mux.HandleFunc("GET /user/products/", h.UserGetProductHandler)

	// Lấy thông tin rút gọn sản phẩm theo ID - Chỉ published
	mux.HandleFunc("GET /user/product/{id}", h.UserGetProductHandler)

	// Lấy thông tin rút gọn sản phẩm theo slug - Chỉ published
	mux.HandleFunc("GET /user/product/slug/{slug}", h.UserGetProductHandler)

	// Tìm kiếm sản phẩm theo tên/thương hiệu - Chỉ published
	mux.HandleFunc("POST /user/products/search", h.UserSearchProductHandler)
}
