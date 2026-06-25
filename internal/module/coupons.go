package module

import (
	"database/sql"
	couponsController "golang/internal/controller/coupons"
	couponsHandler "golang/internal/handler/coupons"
	"golang/internal/repository/coupons"
	"golang/internal/router"
	"golang/internal/controller/audit"
	"net/http"
)

func InitCouponsModule(db *sql.DB, mux *http.ServeMux, auditCtrl audit.AuditController) {
	// Khởi tạo Repository
	repo := coupons.NewCouponsRepository(db)

	// Khởi tạo Controller
	ctrl := couponsController.NewCouponsController(repo, auditCtrl)

	// Khởi tạo Handler
	hdl := couponsHandler.NewCouponsHandler(ctrl)

	// Đăng ký Router
	router.NewCouponsRouter(mux, hdl)
}
