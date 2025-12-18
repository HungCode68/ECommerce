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
	categoryHandler *handler.CategoryHandler,
	productVariantHandler *handler.VariantHandler,
) http.Handler {

	mux := http.NewServeMux()
	// Đăng ký router User
	NewUserRouter(mux, userHandler)

	// Đăng ký router Address
	NewAddressRouter(mux, addressHandler)

	// Đăng ký router Product
	RegisterProductRoutes(mux, productHandler)

	// Đăng ký router Category
    NewCategoryRouter(mux, categoryHandler)

	ProductVariantRouter(mux,productVariantHandler)


	// 3. Đăng ký Health Check (Optional - để check server sống hay chết)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	return mux
}
