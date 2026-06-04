package router

import (
	"golang/internal/handler/productreview"
	"golang/internal/middleware"
	"net/http"
)

// NewProductReviewRouter registers review related routes.
func NewProductReviewRouter(mux *http.ServeMux, h productreview.ProductReviewHandler) http.Handler {
	userGroup := newGroup(mux, "/api")
	authUserGroup := newGroup(mux, "/api", middleware.AuthMiddleware)
	adminGroup := newGroup(mux, "/api/admin", middleware.AdminOnlyMiddleware)

	// Public: list reviews of a product
	userGroup.HandleFunc("GET", "/product/{id}/reviews", h.ListReviewsHandler)

	// Authenticated user: reviews
	authUserGroup.HandleFunc("GET", "/product/{id}/reviews/order/{orderId}", h.GetUserReviewByOrderHandler)
	authUserGroup.HandleFunc("POST", "/product/{id}/reviews", h.CreateReviewHandler)
	authUserGroup.HandleFunc("PUT", "/product/{id}/reviews/{reviewId}", h.EditUserReviewHandler)
	authUserGroup.HandleFunc("DELETE", "/product/{id}/reviews/{reviewId}", h.DeleteReviewHandler)
	authUserGroup.HandleFunc("POST", "/product/reviews/upload-image", h.UploadReviewImageHandler)

	// Admin: review management
	adminGroup.HandleFunc("GET", "/reviews", h.GetAllReviewsAdminHandler)
	adminGroup.HandleFunc("PUT", "/reviews/{reviewId}/reply", h.AdminReplyToReviewHandler)
	adminGroup.HandleFunc("DELETE", "/reviews/{reviewId}", h.AdminDeleteReviewHandler)

	return mux
}
