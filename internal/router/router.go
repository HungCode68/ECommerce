package router

import (
	addressRouter "golang/internal/handler/address"
	categoryRouter "golang/internal/handler/category"
	productRouter "golang/internal/handler/product"
	producthistory "golang/internal/handler/producthistory"
	productVariantRouter "golang/internal/handler/productvariant"
	userRouter "golang/internal/handler/user"

	"net/http"
)

// NewRouter: Hàm khởi tạo Router tổng
func NewRouter(
	userHandler userRouter.UserHandler,
	addressHandler addressRouter.AddressHandler,
	productHandler productRouter.ProductHandler,
	categoryHandler categoryRouter.CategoryHandler,
	productVariantHandler productVariantRouter.ProductVariantHandler,
	productHistoryHandler producthistory.ProductHistoryHandler,
) http.Handler {

	mux := http.NewServeMux()
	// Đăng ký router User
	NewUserRouter(mux, userHandler)

	// Đăng ký router Address
	NewAddressRouter(mux, addressHandler)

	// Đăng ký router Product
	NewProductRouter(mux, productHandler)

	// Đăng ký router Category
	NewCategoryRouter(mux, categoryHandler)

	NewProductVariantRouter(mux, productVariantHandler)

	NewProductHistoryRouter(mux, productHistoryHandler)

	// 3. Đăng ký Health Check (Optional - để check server sống hay chết)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	return mux
}
