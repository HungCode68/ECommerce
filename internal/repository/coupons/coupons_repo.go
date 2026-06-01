package coupons

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"golang/internal/model"
	"strings"
	"time"
)

type CouponsRepo struct {
	DB *sql.DB
}

func NewCouponsRepository(db *sql.DB) CouponsRepository {
	return &CouponsRepo{DB: db}
}

func (r *CouponsRepo) CreateCoupon(ctx context.Context, req model.CreateCouponRequest) (*model.Coupons, error) {
	now := time.Now()
	query := `INSERT INTO coupons (
		code, description, discount_type, discount_value, 
		min_order_value, max_discount_amount, usage_limit, 
		usage_count, user_usage_limit, use_usage_limit, is_active, 
		start_date, end_date, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`

	res, err := r.DB.ExecContext(ctx, query,
		req.Code, req.Description, req.DiscountType, req.DiscountValue,
		req.MinOrderValue, req.MaxDiscountAmount, req.UsageLimit,
		req.UserUsageLimit, req.UseUsageLimit, req.IsActive,
		req.StartDate, req.EndDate, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert coupon: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	return r.GetCouponByID(ctx, id)
}

func (r *CouponsRepo) UpdateCoupon(ctx context.Context, id int64, req model.UpdateCouponRequest) (*model.Coupons, error) {
	now := time.Now()
	query := `UPDATE coupons SET 
		code = ?, description = ?, discount_type = ?, discount_value = ?,
		min_order_value = ?, max_discount_amount = ?, usage_limit = ?, 
		user_usage_limit = ?, use_usage_limit = ?, is_active = ?, start_date = ?, end_date = ?, updated_at = ?
		WHERE id = ?`

	_, err := r.DB.ExecContext(ctx, query,
		req.Code, req.Description, req.DiscountType, req.DiscountValue,
		req.MinOrderValue, req.MaxDiscountAmount, req.UsageLimit,
		req.UserUsageLimit, req.UseUsageLimit, req.IsActive, req.StartDate, req.EndDate, now, id,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update coupon: %w", err)
	}

	return r.GetCouponByID(ctx, id)
}

func (r *CouponsRepo) DeleteCoupon(ctx context.Context, id int64) error {
	query := `DELETE FROM coupons WHERE id = ?`
	_, err := r.DB.ExecContext(ctx, query, id)
	return err
}

func (r *CouponsRepo) BulkDeleteCoupon(ctx context.Context, req model.BulkDeleteCouponsRequest) error {
	if len(req.IDs) == 0 {
		return nil
	}
	args := make([]interface{}, len(req.IDs))
	placeholders := make([]string, len(req.IDs))
	for i, id := range req.IDs {
		args[i] = id
		placeholders[i] = "?"
	}
	query := fmt.Sprintf(`DELETE FROM coupons WHERE id IN (%s)`, strings.Join(placeholders, ","))
	_, err := r.DB.ExecContext(ctx, query, args...)
	return err
}

func (r *CouponsRepo) GetCouponByID(ctx context.Context, id int64) (*model.Coupons, error) {
	query := `SELECT id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, user_usage_limit, use_usage_limit, is_active, start_date, end_date, created_at, updated_at FROM coupons WHERE id = ?`
	row := r.DB.QueryRowContext(ctx, query, id)

	var c model.Coupons
	err := row.Scan(
		&c.ID, &c.Code, &c.Description, &c.DiscountType, &c.DiscountValue,
		&c.MinOrderValue, &c.MaxDiscountAmount, &c.UsageLimit, &c.UsageCount,
		&c.UserUsageLimit, &c.UseUsageLimit, &c.IsActive, &c.StartDate, &c.EndDate,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("coupon not found")
		}
		return nil, err
	}
	return &c, nil
}

func (r *CouponsRepo) GetAllCoupons(ctx context.Context, req model.GetAllCouponsRequest) ([]model.Coupons, error) {
	query := `SELECT id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, user_usage_limit, use_usage_limit, is_active, start_date, end_date, created_at, updated_at FROM coupons`
	var args []interface{}

	if req.Search != "" {
		query += ` WHERE code LIKE ? OR description LIKE ?`
		term := "%" + req.Search + "%"
		args = append(args, term, term)
	}

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var coupons []model.Coupons
	for rows.Next() {
		var c model.Coupons
		if err := rows.Scan(&c.ID, &c.Code, &c.Description, &c.DiscountType, &c.DiscountValue, &c.MinOrderValue, &c.MaxDiscountAmount, &c.UsageLimit, &c.UsageCount, &c.UserUsageLimit, &c.UseUsageLimit, &c.IsActive, &c.StartDate, &c.EndDate, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		coupons = append(coupons, c)
	}
	return coupons, nil
}

func (r *CouponsRepo) GetManyCoupons(ctx context.Context, req model.GetManyCouponsRequest) ([]model.Coupons, error) {
	if len(req.IDs) == 0 {
		return nil, nil
	}
	args := make([]interface{}, len(req.IDs))
	placeholders := make([]string, len(req.IDs))
	for i, id := range req.IDs {
		args[i] = id
		placeholders[i] = "?"
	}
	query := fmt.Sprintf(`SELECT id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, user_usage_limit, use_usage_limit, is_active, start_date, end_date, created_at, updated_at FROM coupons WHERE id IN (%s)`, strings.Join(placeholders, ","))
	
	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var coupons []model.Coupons
	for rows.Next() {
		var c model.Coupons
		if err := rows.Scan(&c.ID, &c.Code, &c.Description, &c.DiscountType, &c.DiscountValue, &c.MinOrderValue, &c.MaxDiscountAmount, &c.UsageLimit, &c.UsageCount, &c.UserUsageLimit, &c.UseUsageLimit, &c.IsActive, &c.StartDate, &c.EndDate, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		coupons = append(coupons, c)
	}
	return coupons, nil
}

func (r *CouponsRepo) GetCouponByCode(ctx context.Context, code string) (*model.Coupons, error) {
	query := `SELECT id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, user_usage_limit, use_usage_limit, is_active, start_date, end_date, created_at, updated_at FROM coupons WHERE code = ?`
	row := r.DB.QueryRowContext(ctx, query, code)

	var c model.Coupons
	err := row.Scan(
		&c.ID, &c.Code, &c.Description, &c.DiscountType, &c.DiscountValue,
		&c.MinOrderValue, &c.MaxDiscountAmount, &c.UsageLimit, &c.UsageCount,
		&c.UserUsageLimit, &c.UseUsageLimit, &c.IsActive, &c.StartDate, &c.EndDate,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("coupon not found")
		}
		return nil, err
	}
	return &c, nil
}

func (r *CouponsRepo) GetAvailableCoupons(ctx context.Context, req model.GetAvailableCouponsRequest) ([]model.Coupons, error) {
	// is_active=true, start_date <= now, end_date >= now (or null), usage_count < usage_limit
	now := time.Now().Format(time.RFC3339)
	query := `SELECT id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, user_usage_limit, use_usage_limit, is_active, start_date, end_date, created_at, updated_at 
		FROM coupons 
		WHERE is_active = true 
		AND (start_date IS NULL OR start_date <= ?) 
		AND (end_date IS NULL OR end_date >= ?)
		AND (usage_limit IS NULL OR usage_count < usage_limit)
		AND (min_order_value IS NULL OR min_order_value <= ?)`
		
	rows, err := r.DB.QueryContext(ctx, query, now, now, req.OrderAmount)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var coupons []model.Coupons
	for rows.Next() {
		var c model.Coupons
		if err := rows.Scan(&c.ID, &c.Code, &c.Description, &c.DiscountType, &c.DiscountValue, &c.MinOrderValue, &c.MaxDiscountAmount, &c.UsageLimit, &c.UsageCount, &c.UserUsageLimit, &c.UseUsageLimit, &c.IsActive, &c.StartDate, &c.EndDate, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		coupons = append(coupons, c)
	}
	return coupons, nil
}

func (r *CouponsRepo) ApplyCoupon(ctx context.Context, tx *sql.Tx, couponID, userID, orderID int64) error {
	now := time.Now().Format(time.RFC3339)
	query := `INSERT INTO user_coupons (coupon_id, user_id, order_id, used_at) VALUES (?, ?, ?, ?)`
	
	if tx != nil {
		_, err := tx.ExecContext(ctx, query, couponID, userID, orderID, now)
		return err
	}
	
	_, err := r.DB.ExecContext(ctx, query, couponID, userID, orderID, now)
	return err
}

func (r *CouponsRepo) IncrementUsageCount(ctx context.Context, tx *sql.Tx, couponID int64) error {
	query := `UPDATE coupons SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)`
	
	var res sql.Result
	var err error

	if tx != nil {
		res, err = tx.ExecContext(ctx, query, couponID)
	} else {
		res, err = r.DB.ExecContext(ctx, query, couponID)
	}

	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("coupon usage limit exceeded or coupon not found")
	}

	return nil
}

func (r *CouponsRepo) CountUserUsage(ctx context.Context, couponID, userID int64) (int, error) {
	query := `SELECT COUNT(*) FROM user_coupons WHERE coupon_id = ? AND user_id = ?`
	var count int
	err := r.DB.QueryRowContext(ctx, query, couponID, userID).Scan(&count)
	return count, err
}
