package stats

import (
	"context"
	"golang/internal/model"
)

type IStatsRepository interface {
	//  Lấy số liệu tổng quan cho Dashboard (Hôm nay & Tháng này)
	GetDashboardOverview(ctx context.Context, filter model.StatsFilter) (*model.DashboardOverviewResponse, error)

	// Lấy Top sản phẩm sắp hết hàng (Table)
	GetTopSellingProducts(ctx context.Context, filter model.StatsFilter) ([]model.ProductSalesStatsResponse, error)

	// Lấy tổng số sản phẩm và số sản phẩm sắp hết hàng
	GetProductCatalogSummary(ctx context.Context, lowStockThreshold int) (totalProducts int64, lowStockCount int64, err error)

	// Lấy chuỗi doanh thu theo ngày
	GetRevenueChart(ctx context.Context, filter model.StatsFilter) ([]model.RevenueChartResponse, error)

	//  Lấy số liệu thống kê sản phẩm
	GetProductStats(ctx context.Context, productID int64, filter model.StatsFilter) ([]model.ProductDailyStatsResponse, error)

	// Lấy dữ liệu báo cáo PDF
	GetPDFReportData(ctx context.Context, req model.GetPDFReportRequest) (*model.ReportDataResponse, error)

	//  Refresh thống kê hàng ngày
	RunDailyStatJob(ctx context.Context) error
}
