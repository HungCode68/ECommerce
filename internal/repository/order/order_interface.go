package repository

import (
	"context"
	"golang/internal/model"
)

type IOrderRepository interface {

	// Tạo đơn hàng 
	CreateOrder(ctx context.Context, order *model.Order, items []model.OrderItem, address *model.OrderAddress, initialPayment *model.OrderPayment) error

	//  Cập nhật trạng thái đơn hàng.
	UpdateOrderStatus(ctx context.Context, orderID int64, newStatus string, note string, changedBy *int64) error

	// Xác nhận thanh toán
	ConfirmPayment(ctx context.Context, orderID int64, payment *model.OrderPayment) error

	//  Lấy thông tin cơ bản của đơn hàng 
	GetOrderByID(ctx context.Context, id int64) (*model.Order, error)

	//  Tìm theo mã đơn hàng (VD: "ORD-123456").
	GetByOrderNumber(ctx context.Context, orderNumber string) (*model.Order, error)

	// GetOrders: Lấy danh sách đơn hàng có phân trang & lọc 
	GetOrders(ctx context.Context, filter model.OrderFilter) ([]model.Order, int, error)

	// Lấy danh sách sản phẩm trong đơn.
	GetOrderItems(ctx context.Context, orderID int64) ([]model.OrderItem, error)

	// Lấy địa chỉ giao hàng 
	GetOrderAddress(ctx context.Context, orderID int64) (*model.OrderAddress, error)

	// Lấy lịch sử giao dịch thanh toán
	GetOrderPayments(ctx context.Context, orderID int64) ([]model.OrderPayment, error)

	//  Lấy nhật ký thay đổi trạng thái đơn hàng.
	GetOrderStatusHistory(ctx context.Context, orderID int64) ([]model.OrderStatusHistory, error)
	
	// Kiểm tra người dùng đã mua sản phẩm chưa
	HasUserPurchasedProduct(ctx context.Context, userID int64, productID int64) (bool, error)
}