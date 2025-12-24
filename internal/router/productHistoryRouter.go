package router

import (
	producthistory "golang/internal/handler/producthistory"
	"golang/internal/middleware"
	"net/http"
)

func NewProductHistoryRouter(mux *http.ServeMux, h producthistory.ProductHistoryHandler) http.Handler {

	historyGroup := newGroup(mux, "/admin/product", middleware.AdminOnlyMiddleware)
	// Lấy lịch sử thay đổi của một sản phẩm cụ thể
	historyGroup.HandleFunc("GET", "/history", h.GetProductHistoryByProductIDHandler)

	// Lấy lịch sử thay đổi của tất cả sản phẩm
	historyGroup.HandleFunc("GET", "/history/all", h.GetAllProductsHistoryHandler)
	return mux
}
