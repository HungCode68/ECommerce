package router

import (
	"golang/internal/handler"
	"golang/internal/middleware"
	"net/http"
)

func RegisterProductRoutes(mux *http.ServeMux, h *handler.ProductHandler) {
	
	// ADMIN ROUTES - Quản lý sản phẩm (đầy đủ quyền)
	

	// Tạo sản phẩm mới - Kiểm tra trùng lặp tên và slug
	createHandler:= http.HandlerFunc(h.CreateProductHandler)
	mux.HandleFunc("POST /admin/product", middleware.AdminOnlyMiddleware(createHandler).ServeHTTP)

	// Lấy chi tiết sản phẩm theo tên (query parameter ?name=xxx)
	getDetailHandler := http.HandlerFunc(h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/", middleware.AdminOnlyMiddleware(getDetailHandler).ServeHTTP)

	// Lấy chi tiết sản phẩm theo ID
	getByIDHandler := http.HandlerFunc(h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/{id}", middleware.AdminOnlyMiddleware(getByIDHandler).ServeHTTP)

	// Lấy chi tiết sản phẩm theo slug (đường dẫn thân thiện)
	getBySlugHandler := http.HandlerFunc(h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/slug/{slug}", middleware.AdminOnlyMiddleware(getBySlugHandler).ServeHTTP)

	// Lấy tất cả sản phẩm (không bao gồm đã xóa mềm)
	getAllHandler := http.HandlerFunc(h.AdminGetAllProductHandler)
	mux.HandleFunc("GET /admin/product/all", middleware.AdminOnlyMiddleware(getAllHandler).ServeHTTP)

	// Lấy nhiều sản phẩm theo danh sách IDs (body: {"ids": [1,2,3]})
	getManyHandler := http.HandlerFunc(h.AdminGetManyProductController)
	mux.HandleFunc("POST /admin/products/many", middleware.AdminOnlyMiddleware(getManyHandler).ServeHTTP)

	// Tìm kiếm sản phẩm theo tên (LIKE) hoặc thương hiệu (exact match)
	searchHandler := http.HandlerFunc(h.AdminSearchProductsHandler)
	mux.HandleFunc("POST /admin/products/search", middleware.AdminOnlyMiddleware(searchHandler).ServeHTTP)

	// Cập nhật thông tin sản phẩm
	updateHandler := http.HandlerFunc(h.UpdateProductHandler)
	mux.HandleFunc("PUT /admin/product/update/{id}", middleware.AdminOnlyMiddleware(updateHandler).ServeHTTP)

	// Xóa mềm sản phẩm đơn (set deleted_at)
	deleteSoftHandler := http.HandlerFunc(h.AdminDeleteSoftProductHandler)
	mux.HandleFunc("DELETE /admin/product/delesoft/{id}", middleware.AdminOnlyMiddleware(deleteSoftHandler).ServeHTTP)

	// Lấy danh sách tất cả sản phẩm đã xóa mềm
	getAllDeleteSoftHandler := http.HandlerFunc(h.AdminGetAllSoftDeletedProductsHandler)
	mux.HandleFunc("GET /admin/products/deleted", middleware.AdminOnlyMiddleware(getAllDeleteSoftHandler).ServeHTTP)

	// Xóa mềm nhiều sản phẩm cùng lúc (body: {"ids": [1,2,3]})
	deleteManyHandler := http.HandlerFunc(h.AdminBulkDeleteSoftProductsHandler)
	mux.HandleFunc("POST /admin/products/delesoft/multi", middleware.AdminOnlyMiddleware(deleteManyHandler).ServeHTTP)

	// Xóa vĩnh viễn tất cả sản phẩm đã xóa mềm (hard delete)
	deleteHardHandler := http.HandlerFunc(h.AdminDeleteAllProductsHandler)
	mux.HandleFunc("DELETE /admin/products/deleall", middleware.AdminOnlyMiddleware(deleteHardHandler).ServeHTTP)


	// USER ROUTES - Xem sản phẩm 

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
