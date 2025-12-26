package router

import (
	"golang/internal/handler/productreview"
	"golang/internal/middleware"
	"net/http"
)

// NewProductReviewRouter registers review related routes.
func NewProductReviewRouter(mux *http.ServeMux, h productreview.ProductReviewHandler) http.Handler {
	userGroup := newGroup(mux, "/user")
	authUserGroup := newGroup(mux, "/user", middleware.AuthMiddleware)
	adminGroup := newGroup(mux, "/admin", middleware.AdminOnlyMiddleware)

	// Public: list reviews of a product
	userGroup.HandleFunc("GET", "/product/{id}/reviews", h.ListReviewsHandler)

	// Authenticated user: create review
	authUserGroup.HandleFunc("POST", "/product/{id}/reviews", h.CreateReviewHandler)

	// Admin: delete review
	adminGroup.HandleFunc("DELETE", "/product/reviews/{reviewId}", h.DeleteReviewHandler)

	adminGroup.HandleFunc("GET", "/product/{id}/reviews", h.ListReviewsHandler)

	return mux
}
