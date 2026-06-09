package router

import (
	"golang/internal/handler/coupons"
	"golang/internal/middleware"
	"net/http"
)

func NewCouponsRouter(mux *http.ServeMux, h coupons.CouponsHandler) http.Handler {
	// Group User (Public hoặc dùng Authenticated tuỳ ý)
	userGroup := newGroup(mux, "/api/coupons", middleware.AuthMiddleware)
	userGroup.HandleFunc("POST", "/available", h.GetAvailableCoupons)
	userGroup.HandleFunc("POST", "/validate", h.ValidateCoupon)
	userGroup.HandleFunc("POST", "/apply", h.ApplyCoupon)

	// Group Admin
	adminGroup := newGroup(mux, "/api/admin/coupons", middleware.AdminOnlyMiddleware)
	adminGroup.HandleFunc("GET", "", h.GetAllCoupons)
	adminGroup.HandleFunc("POST", "", h.CreateCoupon)
	adminGroup.HandleFunc("DELETE", "", h.BulkDeleteCoupon)

	adminGroup.HandleFunc("GET", "/{id}", h.GetCouponByID)
	adminGroup.HandleFunc("PUT", "/{id}", h.UpdateCoupon)
	adminGroup.HandleFunc("DELETE", "/{id}", h.DeleteCoupon)

	return mux
}
