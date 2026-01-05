package order

import "net/http"

type OrderHandler interface {
	
	CreateOrder(w http.ResponseWriter, r *http.Request)

	// Lấy danh sách đơn hàng của chính user đang đăng nhập
	GetMyListOrders(w http.ResponseWriter, r *http.Request)

	// Xem chi tiết một đơn hàng cụ thể 
	GetMyOrderDetail(w http.ResponseWriter, r *http.Request)

	// Hủy hàng
	CancelOrder(w http.ResponseWriter, r *http.Request)

	// Admin tìm kiếm tất cả đơn hàng trong hệ thống
	SearchOrders(w http.ResponseWriter, r *http.Request)

	// Xem chi tiết đơn hàng (kèm lịch sử log, thông tin user)
	GetAdminOrderDetail(w http.ResponseWriter, r *http.Request)

	// Cập nhật trạng thái
	UpdateOrderStatus(w http.ResponseWriter, r *http.Request)

	// Xác nhận thanh toán
	ConfirmPayment(w http.ResponseWriter, r *http.Request)
}