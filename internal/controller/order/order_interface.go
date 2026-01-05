package order

import (
	"context"
	"golang/internal/model"
)

type OrderController interface {
	
	//  Xử lý logic đặt hàng
	CreateOrder(ctx context.Context, userID int64, req model.CreateOrderRequest) (*model.OrderResponse, error)

	//  Lấy chi tiết đơn hàng của chính User
	GetMyOrder(ctx context.Context, userID int64, orderID int64) (*model.OrderResponse, error)

	//  Lấy danh sách đơn hàng của User
	GetMyListOrders(ctx context.Context, userID int64, filter model.OrderFilter) ([]model.OrderResponse, int, error)

	//  User tự hủy đơn hàng
	CancelOrder(ctx context.Context, userID int64, orderID int64, reason string) error

	//  Admin xem chi tiết đơn hàng
	GetAdminOrderDetail(ctx context.Context, orderID int64) (*model.AdminOrderResponse, error)

	//  Admin tìm kiếm, lọc tất cả đơn hàng 
	SearchOrders(ctx context.Context, filter model.OrderFilter) ([]model.OrderResponse, int, error)

	//  Admin cập nhật trạng thái (Duyệt đơn, Giao hàng...)
	UpdateOrderStatus(ctx context.Context, orderID int64, req model.AdminUpdateOrderRequest, adminID int64) error

	//  Admin xác nhận thanh toán
	ConfirmPayment(ctx context.Context, orderID int64, status string, adminID int64) error
}