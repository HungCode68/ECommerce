package coupons

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"golang/internal/model"
)

func ptrFloat(f float64) *float64 { return &f }
func ptrInt(i int64) *int64       { return &i }
func ptrStr(s string) *string     { return &s }

type mockCouponsRepo struct {
	getCouponByCode func(code string) (*model.Coupons, error)
	countUserUsage  func(couponID, userID int64) (int, error)
}

func (m *mockCouponsRepo) CreateCoupon(ctx context.Context, req model.CreateCouponRequest) (*model.Coupons, error) { return nil, nil }
func (m *mockCouponsRepo) UpdateCoupon(ctx context.Context, id int64, req model.UpdateCouponRequest) (*model.Coupons, error) { return nil, nil }
func (m *mockCouponsRepo) DeleteCoupon(ctx context.Context, id int64) error { return nil }
func (m *mockCouponsRepo) BulkDeleteCoupon(ctx context.Context, req model.BulkDeleteCouponsRequest) error { return nil }
func (m *mockCouponsRepo) GetCouponByID(ctx context.Context, id int64) (*model.Coupons, error) { return nil, nil }
func (m *mockCouponsRepo) GetAllCoupons(ctx context.Context, req model.GetAllCouponsRequest) ([]model.Coupons, error) { return nil, nil }
func (m *mockCouponsRepo) GetManyCoupons(ctx context.Context, req model.GetManyCouponsRequest) ([]model.Coupons, error) { return nil, nil }
func (m *mockCouponsRepo) GetAvailableCoupons(ctx context.Context, req model.GetAvailableCouponsRequest) ([]model.Coupons, error) { return nil, nil }
func (m *mockCouponsRepo) ApplyCoupon(ctx context.Context, tx *sql.Tx, couponID, userID, orderID int64) error { return nil }
func (m *mockCouponsRepo) IncrementUsageCount(ctx context.Context, tx *sql.Tx, couponID int64) error { return nil }

func (m *mockCouponsRepo) GetCouponByCode(ctx context.Context, code string) (*model.Coupons, error) {
	if m.getCouponByCode != nil {
		return m.getCouponByCode(code)
	}
	return nil, errors.New("not found")
}
func (m *mockCouponsRepo) CountUserUsage(ctx context.Context, couponID, userID int64) (int, error) {
	if m.countUserUsage != nil {
		return m.countUserUsage(couponID, userID)
	}
	return 0, nil
}

func TestValidateCoupon(t *testing.T) {
	futureStr := time.Now().Add(24 * time.Hour).Format(time.RFC3339)
	pastStr := time.Now().Add(-24 * time.Hour).Format(time.RFC3339)

	tests := []struct {
		name           string
		req            model.ValidateCouponRequest
		coupon         *model.Coupons
		expectedValid  bool
		expectedDisAmt float64
	}{
		{
			name: "Mã hợp lệ không giới hạn",
			req:  model.ValidateCouponRequest{Code: "VALID1", UserID: 1, OrderAmount: 100},
			coupon: &model.Coupons{
				ID:            1,
				Code:          "VALID1",
				IsActive:      true,
				DiscountType:  ptrStr("fixed_amount"),
				DiscountValue: ptrFloat(20),
			},
			expectedValid:  true,
			expectedDisAmt: 20,
		},
		{
			name: "Mã bị huỷ",
			req:  model.ValidateCouponRequest{Code: "INACTIVE", UserID: 1, OrderAmount: 100},
			coupon: &model.Coupons{
				ID:       2,
				Code:     "INACTIVE",
				IsActive: false,
			},
			expectedValid: false,
		},
		{
			name: "Mã đã hết hạn",
			req:  model.ValidateCouponRequest{Code: "EXPIRED", UserID: 1, OrderAmount: 100},
			coupon: &model.Coupons{
				ID:       3,
				Code:     "EXPIRED",
				IsActive: true,
				EndDate:  ptrStr(pastStr),
			},
			expectedValid: false,
		},
		{
			name: "Chưa đến hạn sử dụng",
			req:  model.ValidateCouponRequest{Code: "FUTURE", UserID: 1, OrderAmount: 100},
			coupon: &model.Coupons{
				ID:        4,
				Code:      "FUTURE",
				IsActive:  true,
				StartDate: ptrStr(futureStr),
			},
			expectedValid: false,
		},
		{
			name: "Đơn hàng chưa đạt tối thiểu",
			req:  model.ValidateCouponRequest{Code: "MINORDER", UserID: 1, OrderAmount: 100},
			coupon: &model.Coupons{
				ID:            5,
				Code:          "MINORDER",
				IsActive:      true,
				MinOrderValue: ptrFloat(150),
			},
			expectedValid: false,
		},
		{
			name: "Test % discount với Max limit",
			req:  model.ValidateCouponRequest{Code: "PERCENT", UserID: 1, OrderAmount: 1000},
			coupon: &model.Coupons{
				ID:                6,
				Code:              "PERCENT",
				IsActive:          true,
				DiscountType:      ptrStr("percentage"),
				DiscountValue:     ptrFloat(15), // 150
				MaxDiscountAmount: ptrFloat(100),
			},
			expectedValid:  true,
			expectedDisAmt: 100, // limited to 100
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := &mockCouponsRepo{
				getCouponByCode: func(code string) (*model.Coupons, error) {
					if code == tt.req.Code {
						return tt.coupon, nil
					}
					return nil, errors.New("not found")
				},
				countUserUsage: func(couponID, userID int64) (int, error) {
					return 0, nil
				},
			}
			
			ctrl := NewCouponsController(mockRepo, nil)
			resp, err := ctrl.ValidateCoupon(context.Background(), tt.req)
			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}
			if resp.IsValid != tt.expectedValid {
				t.Errorf("Expected IsValid %v, got %v (%s)", tt.expectedValid, resp.IsValid, resp.Message)
			}
			if resp.IsValid && resp.DiscountAmount != tt.expectedDisAmt {
				t.Errorf("Expected DiscountAmount %v, got %v", tt.expectedDisAmt, resp.DiscountAmount)
			}
		})
	}
}
