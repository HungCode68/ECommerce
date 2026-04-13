package coupons

import "net/http"

type CouponsHandler interface {
	CreateCoupon(w http.ResponseWriter, r *http.Request)
	UpdateCoupon(w http.ResponseWriter, r *http.Request)
	DeleteCoupon(w http.ResponseWriter, r *http.Request)
	BulkDeleteCoupon(w http.ResponseWriter, r *http.Request)
	GetCouponByID(w http.ResponseWriter, r *http.Request)
	GetAllCoupons(w http.ResponseWriter, r *http.Request)

	GetAvailableCoupons(w http.ResponseWriter, r *http.Request)
	ValidateCoupon(w http.ResponseWriter, r *http.Request)
	ApplyCoupon(w http.ResponseWriter, r *http.Request)
}
