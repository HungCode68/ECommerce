package coupons

import (
	"context"
	"golang/internal/model"
)

type CouponsController interface {
	// Admin Methods
	CreateCoupon(ctx context.Context, adminID int64, req model.CreateCouponRequest) (model.CouponResponse, error)
	UpdateCoupon(ctx context.Context, adminID int64, id int64, req model.UpdateCouponRequest) (model.CouponResponse, error)
	DeleteCoupon(ctx context.Context, adminID int64, id int64) error
	BulkDeleteCoupon(ctx context.Context, adminID int64, req model.BulkDeleteCouponsRequest) error
	GetCouponByID(ctx context.Context, id int64) (model.CouponResponse, error)
	GetAllCoupons(ctx context.Context, req model.GetAllCouponsRequest) ([]model.CouponResponse, error)

	// User Methods
	GetAvailableCoupons(ctx context.Context, req model.GetAvailableCouponsRequest) ([]model.AvailableCouponResponse, error)
	ValidateCoupon(ctx context.Context, req model.ValidateCouponRequest) (model.ValidateCouponResponse, error)
	ApplyCoupon(ctx context.Context, req model.ApplyCouponRequest) (model.ApplyCouponResponse, error)
}
