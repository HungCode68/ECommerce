package stats

import (
	"context"
	"database/sql"
	"time"

	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/utils" 
)

type StatsRepository struct {
	db *sql.DB
}

func NewStatsRepository(db *sql.DB) IStatsRepository {
	return &StatsRepository{db: db}
}

//  GetDashboardOverview: Lấy số liệu Dashboard
func (r *StatsRepository) GetDashboardOverview(ctx context.Context, filter model.StatsFilter) (*model.DashboardOverviewResponse, error) {
	logger.DebugLogger.Printf("StatsRepo: Starting GetDashboardOverview. Filter: %+v", filter)

	var resp model.DashboardOverviewResponse
	// Biến lưu số liệu
	var estRev, realRev float64
	var estOrd, realOrd int64

	// Biến lưu khoảng thời gian query
	var estStart, estEnd string
	var realStart, realEnd string

	// Điều kiện lọc ngày
	if filter.StartDate == "" || filter.EndDate == "" {
		// không có lọc ngày từ user
		// Estimated: Chỉ lấy hôm nay
		estStart = time.Now().Format("2006-01-02")
		estEnd   = time.Now().Format("2006-01-02")

		// Doanh thu Real: Lấy từ đầu tháng đến hiện tại
		now := time.Now()
		realStart = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).Format("2006-01-02")
		realEnd   = now.Format("2006-01-02")

	} else {
		// Nếu có lọc ngày từ user
		// Cả 2 chỉ số đều chạy theo khoảng thời gian user chọn
		estStart = filter.StartDate
		estEnd   = filter.EndDate
		
		realStart = filter.StartDate
		realEnd   = filter.EndDate
	}

	// Query doanh thu ESTIMATED (Từ bảng orders - realtime)
	// Lấy tất cả đơn hàng đã đặt (trừ đơn hủy) trong khoảng estStart -> estEnd
	queryEst := `
		SELECT 
			COALESCE(COUNT(id), 0), 
			COALESCE(SUM(total_amount), 0)
		FROM orders 
		WHERE DATE(placed_at) >= ? AND DATE(placed_at) <= ?
		AND status != 'cancelled'`

	if err := r.db.QueryRowContext(ctx, queryEst, estStart, estEnd).Scan(&estOrd, &estRev); err != nil {
		logger.ErrorLogger.Printf("StatsRepo: Query Estimated failed: %v", err)
		return nil, err
	}

	//  Query doanh thu REAL (Từ bảng sales_summary_daily - thống kê đã chốt)
	// Lấy số liệu thực tế trong khoảng realStart -> realEnd
	queryReal := `
		SELECT 
			COALESCE(SUM(real_orders), 0), 
			COALESCE(SUM(real_revenue), 0)
		FROM sales_summary_daily
		WHERE summary_date >= ? AND summary_date <= ?`

	if err := r.db.QueryRowContext(ctx, queryReal, realStart, realEnd).Scan(&realOrd, &realRev); err != nil {
		logger.ErrorLogger.Printf("StatsRepo: Query Real failed: %v", err)
		return nil, err
	}

	// Gán vào response	
	resp.EstimatedOrders = estOrd
	resp.EstimatedRevenue = utils.FormatVND(estRev)
	
	resp.RealOrders = realOrd
	resp.RealRevenue = utils.FormatVND(realRev)

	return &resp, nil
}

// GetTopSellingProducts: Top sản phẩm bán chạy
func (r *StatsRepository) GetTopSellingProducts(ctx context.Context, filter model.StatsFilter) ([]model.ProductSalesStatsResponse, error) {
	logger.DebugLogger.Println("StatsRepo: GetTopSellingProducts")
	// Query tổng hợp từ bảng product_sales_daily
	query := `
		SELECT 
			d.product_id,
			d.variant_id,
			p.name AS product_name,
			COALESCE(v.title, '') AS variant_title,
			COALESCE(v.sku, '') AS sku,
			SUM(d.units_sold) AS total_sold,
			SUM(d.revenue) AS total_revenue,
			SUM(d.order_count) AS total_orders
		FROM product_sales_daily d
		JOIN products p ON d.product_id = p.id
		LEFT JOIN product_variants v ON d.variant_id = v.id
		WHERE d.summary_date >= ? AND d.summary_date <= ?
		GROUP BY d.product_id, d.variant_id, p.name, v.title, v.sku
		ORDER BY total_sold DESC
		LIMIT ?`


	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	if filter.StartDate == "" {
		filter.StartDate = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if filter.EndDate == "" {
		filter.EndDate = time.Now().Format("2006-01-02")
	}

	// Thực thi query
	rows, err := r.db.QueryContext(ctx, query, filter.StartDate, filter.EndDate, filter.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make([]model.ProductSalesStatsResponse, 0)
	for rows.Next() {
		var p model.ProductSalesStatsResponse
		if err := rows.Scan(
			&p.ProductID, &p.VariantID, &p.ProductName, &p.VariantTitle, &p.SKU,
			&p.TotalUnitsSold, &p.TotalRevenue, &p.TotalOrders,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	return products, nil
}


// GetProductStats: Lấy số liệu thống kê sản phẩm 
func (r *StatsRepository) GetProductStats(ctx context.Context, productID int64, filter model.StatsFilter) ([]model.ProductDailyStatsResponse, error) {
	logger.DebugLogger.Printf("StatsRepo: GetProductStats for ID %d", productID)

	// Default date range nếu thiếu
	if filter.StartDate == "" {
		filter.StartDate = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if filter.EndDate == "" {
		filter.EndDate = time.Now().Format("2006-01-02")
	}

	// Query tổng hợp từ bảng product_sales_daily
	query := `
		SELECT 
			summary_date, 
			SUM(units_sold), 
			SUM(revenue), 
			SUM(order_count)
		FROM product_sales_daily
		WHERE product_id = ? 
		  AND summary_date >= ? AND summary_date <= ?
		GROUP BY summary_date
		ORDER BY summary_date ASC`

	rows, err := r.db.QueryContext(ctx, query, productID, filter.StartDate, filter.EndDate)
	if err != nil {
		logger.ErrorLogger.Printf("StatsRepo: GetProductStats query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	stats := make([]model.ProductDailyStatsResponse, 0)
	for rows.Next() {
		var s model.ProductDailyStatsResponse
		var date time.Time
		
		if err := rows.Scan(&date, &s.UnitsSold, &s.Revenue, &s.OrderCount); err != nil {
			return nil, err
		}
		s.Date = date.Format("2006-01-02")
		stats = append(stats, s)
	}

	return stats, nil
}

// Chức năng Refresh thống kê hàng ngày
func (r *StatsRepository) RunDailyStatJob(ctx context.Context) error {
    logger.InfoLogger.Println("StatsRepo: Executing sp_Job_UpdateDailyStats...")
    
    _, err := r.db.ExecContext(ctx, "CALL sp_Job_UpdateDailyStats()")
    
    if err != nil {
        logger.ErrorLogger.Printf("StatsRepo: sp_Job_UpdateDailyStats failed: %v", err)
        return err
    }
    
    logger.InfoLogger.Println("StatsRepo: sp_Job_UpdateDailyStats completed successfully")
    return nil
}