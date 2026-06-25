package module

import (
	"database/sql"
	"net/http"

	orderController "golang/internal/controller/order"
	orderHandler "golang/internal/handler/order"
	"golang/internal/controller/audit"

	"golang/internal/repository/address"
	order "golang/internal/repository/order"
	"golang/internal/repository/product"
	"golang/internal/repository/productvariant"
	userRepository "golang/internal/repository/user"

	couponsRepository "golang/internal/repository/coupons"
	notificationRepo "golang/internal/repository/notification"

	"golang/internal/router"
)

func InitOrderModule(db *sql.DB, mux *http.ServeMux, auditCtrl audit.AuditController) {
	orderRepo := order.NewOrderRepository(db)
	productRepo := product.NewProductRepo(db)
	variantRepo := productvariant.NewVariantRepo(db)
	addressRepo := address.NewAddressDb(db)

	couponRepo := couponsRepository.NewCouponsRepository(db)
	userRepo := userRepository.NewUserDb(db)
	notifRepo := notificationRepo.NewNotificationRepo(db)

	//  Khởi tạo Controller
	ctrl := orderController.NewOrderController(
		orderRepo,
		productRepo,
		variantRepo,
		addressRepo,
		couponRepo,
		notifRepo,
		auditCtrl,
	)

	//  Khởi tạo Handler
	hdl := orderHandler.NewOrderHandler(ctrl, userRepo)

	//  Đăng ký Router
	router.NewOrderRouter(mux, hdl)
}
