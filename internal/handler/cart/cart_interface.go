package cart

import "net/http"

// CartHandler định nghĩa các hàm xử lý request (Standard net/http)
type CartHandler interface {
	
	GetCart(w http.ResponseWriter, r *http.Request)

	
	AddToCart(w http.ResponseWriter, r *http.Request)

	
	UpdateCartItem(w http.ResponseWriter, r *http.Request)

	
	RemoveCartItems(w http.ResponseWriter, r *http.Request)

	
	CalculateCheckoutPreview(w http.ResponseWriter, r *http.Request)
}