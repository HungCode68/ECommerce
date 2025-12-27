package router

import (
	"golang/internal/handler/cart"
	"golang/internal/middleware"
	"net/http"
)

// NewCartRouter định nghĩa các routes cho module Cart
func NewCartRouter(mux *http.ServeMux, cartHandler cart.CartHandler) http.Handler {
	
	cartGroup := newGroup(mux, "/api/cart", middleware.AuthMiddleware)

	//  Xem giỏ hàng
	cartGroup.HandleFunc("GET", "", cartHandler.GetCart)

	//  Thêm vào giỏ hàng
	cartGroup.HandleFunc("POST", "", cartHandler.AddToCart)

	//  Cập nhật số lượng 
	cartGroup.HandleFunc("PUT", "/items/{id}", cartHandler.UpdateCartItem)

	//  Xóa sản phẩm
	cartGroup.HandleFunc("DELETE", "/items", cartHandler.RemoveCartItems)

	// Tính toán Checkout (Preview)
	cartGroup.HandleFunc("POST", "/checkout-preview", cartHandler.CalculateCheckoutPreview)

	return mux
}