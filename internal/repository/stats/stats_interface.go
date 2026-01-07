package stats

import (
	"context"
	"golang/internal/model"
)

type IStatsRepository interface {
	//  Lấy số liệu tổng quan cho Dashboard (Hôm nay & Tháng này)
	GetDashboardOverview(ctx context.Context, filter model.StatsFilter) (*model.DashboardOverviewResponse, error)

	// Lấy Top sản phẩm bán chạy (Table)
	GetTopSellingProducts(ctx context.Context, filter model.StatsFilter) ([]model.ProductSalesStatsResponse, error)

	//  Lấy số liệu thống kê sản phẩm 
	GetProductStats(ctx context.Context, productID int64, filter model.StatsFilter) ([]model.ProductDailyStatsResponse, error)

	//  Refresh thống kê hàng ngày
	RunDailyStatJob(ctx context.Context) error
}
