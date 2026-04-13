package coupons

import (
	"context"
	"fmt"
	"time"

	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/repository/coupons"
)

type couponsController struct {
	CouponsRepo coupons.CouponsRepository
}

func NewCouponsController(repo coupons.CouponsRepository) CouponsController {
	return &couponsController{
		CouponsRepo: repo,
	}
}

// Convert DB Model to API Response
func mapCouponToResponse(c *model.Coupons) model.CouponResponse {
	return model.CouponResponse{
		ID:                c.ID,
		Code:              c.Code,
		Description:       c.Description,
		DiscountType:      c.DiscountType,
		DiscountValue:     c.DiscountValue,
		MinOrderValue:     c.MinOrderValue,
		MaxDiscountAmount: c.MaxDiscountAmount,
		UsageLimit:        c.UsageLimit,
		UsageCount:        c.UsageCount,
		UserUsageLimit:    c.UserUsageLimit,
		UseUsageLimit:     c.UseUsageLimit,
		IsActive:          c.IsActive,
		StartDate:         c.StartDate,
		EndDate:           c.EndDate,
		CreatedAt:         c.CreatedAt,
		UpdatedAt:         c.UpdatedAt,
	}
}

func (c *couponsController) CreateCoupon(ctx context.Context, req model.CreateCouponRequest) (model.CouponResponse, error) {
	logger.InfoLogger.Printf("Admin tạo mã giảm giá mới: %s", req.Code)

	// Kiểm tra xem Code đã tồn tại chưa
	existing, _ := c.CouponsRepo.GetCouponByCode(ctx, req.Code)
	if existing != nil && existing.ID > 0 {
		return model.CouponResponse{}, fmt.Errorf("mã giảm giá %s đã tồn tại", req.Code)
	}

	coupon, err := c.CouponsRepo.CreateCoupon(ctx, req)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi tạo mã giảm giá: %v", err)
		return model.CouponResponse{}, err
	}

	return mapCouponToResponse(coupon), nil
}

func (c *couponsController) UpdateCoupon(ctx context.Context, id int64, req model.UpdateCouponRequest) (model.CouponResponse, error) {
	logger.InfoLogger.Printf("Admin cập nhật mã giảm giá ID: %d", id)

	// Kiểm tra nếu Code mới bị trùng với 1 coupon khác
	existing, _ := c.CouponsRepo.GetCouponByCode(ctx, req.Code)
	if existing != nil && existing.ID != id {
		return model.CouponResponse{}, fmt.Errorf("mã giảm giá %s đã được sử dụng bởi 1 coupon khác", req.Code)
	}

	updated, err := c.CouponsRepo.UpdateCoupon(ctx, id, req)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi cập nhật mã giảm giá: %v", err)
		return model.CouponResponse{}, err
	}

	return mapCouponToResponse(updated), nil
}

func (c *couponsController) DeleteCoupon(ctx context.Context, id int64) error {
	logger.WarnLogger.Printf("Admin xoá mã giảm giá ID: %d", id)
	return c.CouponsRepo.DeleteCoupon(ctx, id)
}

func (c *couponsController) BulkDeleteCoupon(ctx context.Context, req model.BulkDeleteCouponsRequest) error {
	logger.WarnLogger.Printf("Admin xoá nhiều mã giảm giá (%d items)", len(req.IDs))
	return c.CouponsRepo.BulkDeleteCoupon(ctx, req)
}

func (c *couponsController) GetCouponByID(ctx context.Context, id int64) (model.CouponResponse, error) {
	coupon, err := c.CouponsRepo.GetCouponByID(ctx, id)
	if err != nil {
		return model.CouponResponse{}, err
	}
	return mapCouponToResponse(coupon), nil
}

func (c *couponsController) GetAllCoupons(ctx context.Context, req model.GetAllCouponsRequest) ([]model.CouponResponse, error) {
	coupons, err := c.CouponsRepo.GetAllCoupons(ctx, req)
	if err != nil {
		return nil, err
	}

	res := make([]model.CouponResponse, 0, len(coupons))
	for _, coupon := range coupons {
		res = append(res, mapCouponToResponse(&coupon))
	}
	return res, nil
}

func mapToAvailableCouponResponse(c *model.Coupons) model.AvailableCouponResponse {
	return model.AvailableCouponResponse{
		Code:              c.Code,
		Description:       c.Description,
		DiscountType:      c.DiscountType,
		DiscountValue:     c.DiscountValue,
		MinOrderValue:     c.MinOrderValue,
		MaxDiscountAmount: c.MaxDiscountAmount,
		StartDate:         c.StartDate,
		EndDate:           c.EndDate,
	}
}

func (c *couponsController) GetAvailableCoupons(ctx context.Context, req model.GetAvailableCouponsRequest) ([]model.AvailableCouponResponse, error) {
	coupons, err := c.CouponsRepo.GetAvailableCoupons(ctx, req)
	if err != nil {
		return nil, err
	}

	res := make([]model.AvailableCouponResponse, 0, len(coupons))
	for _, coupon := range coupons {
		res = append(res, mapToAvailableCouponResponse(&coupon))
	}
	return res, nil
}

func (c *couponsController) ValidateCoupon(ctx context.Context, req model.ValidateCouponRequest) (model.ValidateCouponResponse, error) {
	coupon, err := c.CouponsRepo.GetCouponByCode(ctx, req.Code)
	if err != nil {
		return model.ValidateCouponResponse{IsValid: false, Message: "Mã giảm giá không tồn tại"}, nil
	}

	if !coupon.IsActive {
		return model.ValidateCouponResponse{IsValid: false, Message: "Mã giảm giá đã bị vô hiệu hoá"}, nil
	}

	// Kiểm tra Date
	nowStr := time.Now().Format(time.RFC3339)
	if coupon.StartDate != nil && *coupon.StartDate > nowStr {
		return model.ValidateCouponResponse{IsValid: false, Message: "Mã giảm giá chưa đến thời gian sử dụng"}, nil
	}
	if coupon.EndDate != nil && *coupon.EndDate < nowStr {
		return model.ValidateCouponResponse{IsValid: false, Message: "Mã giảm giá đã hết hạn"}, nil
	}

	// Giới hạn lượt sử dụng Global
	if coupon.UsageLimit != nil && coupon.UsageCount != nil && *coupon.UsageCount >= *coupon.UsageLimit {
		return model.ValidateCouponResponse{IsValid: false, Message: "Mã giảm giá đã hết lượt sử dụng"}, nil
	}

	// Đơn hàng tối thiểu
	if coupon.MinOrderValue != nil && req.OrderAmount < *coupon.MinOrderValue {
		return model.ValidateCouponResponse{IsValid: false, Message: fmt.Sprintf("Mã giảm giá áp dụng cho đơn hàng từ %v", *coupon.MinOrderValue)}, nil
	}

	// Giới hạn với cá nhân user
	if coupon.UserUsageLimit != nil && *coupon.UserUsageLimit > 0 {
		count, err := c.CouponsRepo.CountUserUsage(ctx, coupon.ID, req.UserID)
		if err != nil {
			return model.ValidateCouponResponse{IsValid: false, Message: "Lỗi kiểm tra giới hạn sử dụng"}, err
		}
		if int64(count) >= *coupon.UserUsageLimit {
			return model.ValidateCouponResponse{IsValid: false, Message: "Bạn đã hết lượt sử dụng mã giảm giá này"}, nil
		}
	}

	// Tính toán tiền giảm giá
	discountAmount := 0.0
	if coupon.DiscountType != nil {
		if *coupon.DiscountType == "percentage" {
			discountAmount = req.OrderAmount * (*coupon.DiscountValue) / 100
			if coupon.MaxDiscountAmount != nil && discountAmount > *coupon.MaxDiscountAmount {
				discountAmount = *coupon.MaxDiscountAmount
			}
		} else {
			discountAmount = *coupon.DiscountValue
		}
	}

	// Chặn việc giảm quá số tiền đơn hàng
	if discountAmount > req.OrderAmount {
		discountAmount = req.OrderAmount
	}

	return model.ValidateCouponResponse{
		IsValid:        true,
		CouponID:       coupon.ID,
		Message:        "Áp dụng mã giảm giá thành công",
		DiscountAmount: discountAmount,
		FinalAmount:    req.OrderAmount - discountAmount,
	}, nil
}

func (c *couponsController) ApplyCoupon(ctx context.Context, req model.ApplyCouponRequest) (model.ApplyCouponResponse, error) {
	// Kiểm tra coupon trước khi áp dụng
	valReq := model.ValidateCouponRequest{
		Code:        req.Code,
		UserID:      req.UserID,
		OrderAmount: req.OrderAmount,
	}
	valRes, err := c.ValidateCoupon(ctx, valReq)
	if err != nil || !valRes.IsValid {
		return model.ApplyCouponResponse{}, fmt.Errorf("không thể áp dụng mã giảm giá: %s", valRes.Message)
	}

	coupon, _ := c.CouponsRepo.GetCouponByCode(ctx, req.Code)

	// Ghi nhận số lượt dùng. Ở đây có thể gặp concurrent race, nhưng tạm chấp nhận ở controller logic.
	err = c.CouponsRepo.IncrementUsageCount(ctx, nil, coupon.ID)
	if err != nil {
		return model.ApplyCouponResponse{}, fmt.Errorf("lỗi tăng số lượt dùng coupon: %v", err)
	}

	// Ghi lại lịch sử (cần OrderID thực tế khi Order Checkout gọi đến, ở đây tạm pass 0)
	err = c.CouponsRepo.ApplyCoupon(ctx, nil, coupon.ID, req.UserID, 0)
	if err != nil {
		return model.ApplyCouponResponse{}, fmt.Errorf("lỗi ghi nhận lịch sử dùng coupon: %v", err)
	}

	logger.InfoLogger.Printf("User %d áp dụng thành công mã %s", req.UserID, coupon.Code)

	return model.ApplyCouponResponse{
		CouponID:       coupon.ID,
		Code:           coupon.Code,
		DiscountType:   *coupon.DiscountType,
		DiscountAmount: valRes.DiscountAmount,
		FinalAmount:    valRes.FinalAmount,
	}, nil
}
