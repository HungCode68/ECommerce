package stats

import (
	"context"
	"golang/internal/model"
)

type StatsController interface {
	//  Lấy số liệu tổng quan cho Dashboard
	GetDashboardOverview(ctx context.Context, filter model.StatsFilter) (*model.DashboardOverviewResponse, error)

	// Lấy danh sách Top sản phẩm bán chạy (có lọc theo ngày)
	GetTopSellingProducts(ctx context.Context, filter model.StatsFilter) ([]model.ProductSalesStatsResponse, error)

	//  Lấy số liệu thống kê của 1 sản phẩm 
	GetProductStats(ctx context.Context, productID int64, filter model.StatsFilter) ([]model.ProductDailyStatsResponse, error)

	// Refresh thống kê hàng ngày
	SyncDailyStats(ctx context.Context) error
}
