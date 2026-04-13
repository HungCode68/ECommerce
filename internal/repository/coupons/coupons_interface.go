package coupons

import (
	"context"
	"database/sql"
	"golang/internal/model"
)

type CouponsRepository interface {
	// Tạo mã giảm giá mới
	CreateCoupon(ctx context.Context, req model.CreateCouponRequest) (*model.Coupons, error)
	// Cập nhật thông tin mã giảm giá
	UpdateCoupon(ctx context.Context, id int64, req model.UpdateCouponRequest) (*model.Coupons, error)
	// Xoá mã giảm giá theo ID
	DeleteCoupon(ctx context.Context, id int64) error
	// Xoá nhiều mã giảm giá cùng lúc
	BulkDeleteCoupon(ctx context.Context, req model.BulkDeleteCouponsRequest) error
	// Lấy mã giảm giá theo ID
	GetCouponByID(ctx context.Context, id int64) (*model.Coupons, error)
	// Lấy danh sách tất cả mã giảm giá
	GetAllCoupons(ctx context.Context, req model.GetAllCouponsRequest) ([]model.Coupons, error)
	// Lấy danh sách nhiều mã giảm giá theo IDs
	GetManyCoupons(ctx context.Context, req model.GetManyCouponsRequest) ([]model.Coupons, error)
	// Lấy mã giảm giá dựa trên chuỗi Code (VD: TET2025)
	GetCouponByCode(ctx context.Context, code string) (*model.Coupons, error)
	// Lấy danh sách các mã giảm giá còn hiệu lực để User có thể áp dụng
	GetAvailableCoupons(ctx context.Context, req model.GetAvailableCouponsRequest) ([]model.Coupons, error)
	
	// Transaction-aware methods
	// Lưu lại lịch sử áp dụng mã giảm giá của User cho một Đơn hàng
	ApplyCoupon(ctx context.Context, tx *sql.Tx, couponID, userID, orderID int64) error
	// Tăng số lượt đã sử dụng của mã giảm giá lên 1
	IncrementUsageCount(ctx context.Context, tx *sql.Tx, couponID int64) error

	// Kiểm tra xem User này đã dùng mã giảm giá này bao nhiêu lần (Dùng cho logic limit)
	CountUserUsage(ctx context.Context, couponID, userID int64) (int, error)
}
