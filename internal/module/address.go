package module

import (
	"database/sql"
	addressController "golang/internal/controller/address"
	addressHandler "golang/internal/handler/address"
	"golang/internal/repository/address"
	"golang/internal/router"
	"net/http"
)

// InitAddressModule - Khởi tạo module Address
func InitAddressModule(db *sql.DB, mux *http.ServeMux) {

	// Khởi tạo Repository
	repo := address.NewAddressDb(db)

	//  Khởi tạo Controller
	ctrl := addressController.NewAddressController(repo)

	// Khởi tạo Handler (Cần Validator)
	hdl := addressHandler.NewAddressHandler(ctrl)

	//  Đăng ký Router
	router.NewAddressRouter(mux, hdl)
}
