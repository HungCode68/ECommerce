package router

import (
	"golang/internal/handler"
	"net/http"
)

// NewRouter: Hàm khởi tạo Router tổng
func NewRouter(
	userHandler *handler.UserHandler,
	addressHandler *handler.AddressHandler, 
	productHandler *handler.ProductHandler,
	
) http.Handler {

	mux := http.NewServeMux()

	NewUserRouter(mux, userHandler)

	NewAddressRouter(mux, addressHandler)

	RegisterProductRoutes(mux, productHandler)

	// 3. Đăng ký Health Check (Optional - để check server sống hay chết)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	return mux
}
