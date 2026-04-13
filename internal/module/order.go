package module

import (
	"database/sql"
	"net/http"

	orderController "golang/internal/controller/order"
	orderHandler "golang/internal/handler/order"

	"golang/internal/repository/address"
	order "golang/internal/repository/order"
	"golang/internal/repository/product"
	"golang/internal/repository/productvariant"

	couponsController "golang/internal/controller/coupons"
	couponsRepository "golang/internal/repository/coupons"

	"golang/internal/router"
)

func InitOrderModule(db *sql.DB, mux *http.ServeMux) {
	orderRepo := order.NewOrderRepository(db)
	productRepo := product.NewProductRepo(db)
	variantRepo := productvariant.NewVariantRepo(db)
	addressRepo := address.NewAddressDb(db)
	
	couponRepo := couponsRepository.NewCouponsRepository(db)
	couponCtrl := couponsController.NewCouponsController(couponRepo)

	//  Khởi tạo Controller 
	ctrl := orderController.NewOrderController(
		orderRepo,
		productRepo,
		variantRepo,
		addressRepo,
		couponCtrl,
	)

	//  Khởi tạo Handler
	hdl := orderHandler.NewOrderHandler(ctrl)

	//  Đăng ký Router
	router.NewOrderRouter(mux, hdl)
}
