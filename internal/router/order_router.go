package router

import (
	"golang/internal/handler/order"
	"golang/internal/middleware"
	"net/http"
)

func NewOrderRouter(mux *http.ServeMux, orderHandler order.OrderHandler) http.Handler {
	
	userGroup := newGroup(mux, "/api/orders", middleware.AuthMiddleware)

	//  Tạo đơn hàng mới
	userGroup.HandleFunc("POST", "", orderHandler.CreateOrder)

	//  Lấy danh sách đơn hàng của tôi + Tìm kiếm/Lọc 
	userGroup.HandleFunc("GET", "", orderHandler.GetMyListOrders)

	//  Lấy chi tiết đơn hàng
	userGroup.HandleFunc("GET", "/{id}", orderHandler.GetMyOrderDetail)

	//  Hủy đơn hàng
	userGroup.HandleFunc("POST", "/{id}/cancel", orderHandler.CancelOrder)

	// =================================================================
	adminGroup := newGroup(mux, "/api/admin/orders", middleware.AdminOnlyMiddleware)

	//  Tìm kiếm, lọc tất cả đơn hàng
	adminGroup.HandleFunc("GET", "", orderHandler.SearchOrders)

	// Xem chi tiết đơn hàng (Full log)
	adminGroup.HandleFunc("GET", "/{id}", orderHandler.GetAdminOrderDetail)

	//  Cập nhật trạng thái đơn hàng
	adminGroup.HandleFunc("PUT", "/{id}/status", orderHandler.UpdateOrderStatus)

	// Xác nhận thanh toán
	adminGroup.HandleFunc("POST", "/{id}/confirm-payment", orderHandler.ConfirmPayment)

	return mux
}