package stats

import (
	"context"
	"golang/internal/logger"
	"golang/internal/model"
	repository "golang/internal/repository/stats"
)

type statsController struct {
	StatsRepo repository.IStatsRepository
}

//  Khởi tạo Controller 
func NewStatsController(repo repository.IStatsRepository) StatsController {
	return &statsController{
		StatsRepo: repo,
	}
}

//  Lấy Dashboard Overview 
func (c *statsController) GetDashboardOverview(ctx context.Context, filter model.StatsFilter) (*model.DashboardOverviewResponse, error) {
	logger.DebugLogger.Println("StatsController: Starting GetDashboardOverview")

	resp, err := c.StatsRepo.GetDashboardOverview(ctx, filter)
	if err != nil {
		logger.ErrorLogger.Printf("StatsController: GetDashboardOverview failed: %v", err)
		return nil, err
	}

	logger.InfoLogger.Println("StatsController: GetDashboardOverview success")
	return resp, nil
}

//  Lấy Top sản phẩm bán chạy
func (c *statsController) GetTopSellingProducts(ctx context.Context, filter model.StatsFilter) ([]model.ProductSalesStatsResponse, error) {
	logger.DebugLogger.Printf("StatsController: Starting GetTopSellingProducts. Filter: %+v", filter)

	resp, err := c.StatsRepo.GetTopSellingProducts(ctx, filter)
	if err != nil {
		logger.ErrorLogger.Printf("StatsController: GetTopSellingProducts failed: %v", err)
		return nil, err
	}

	logger.InfoLogger.Printf("StatsController: GetTopSellingProducts success. Found: %d items", len(resp))
	return resp, nil
}

// Lấy số liệu thống kê sản phẩm
func (c *statsController) GetProductStats(ctx context.Context, productID int64, filter model.StatsFilter) ([]model.ProductDailyStatsResponse, error) {
	logger.DebugLogger.Printf("StatsController: Starting GetProductStats. ID: %d", productID)
	
	resp, err := c.StatsRepo.GetProductStats(ctx, productID, filter)
	if err != nil {
		logger.ErrorLogger.Printf("StatsController: GetProductStats failed: %v", err)
		return nil, err
	}
	
	return resp, nil
}

// Refresh dữ liệu thủ công 
func (c *statsController) SyncDailyStats(ctx context.Context) error {
	logger.InfoLogger.Println("StatsController: Starting SyncDailyStats (Manual/Job Trigger)")

	err := c.StatsRepo.RunDailyStatJob(ctx)
	if err != nil {
		logger.ErrorLogger.Printf("StatsController: SyncDailyStats failed: %v", err)
		return err
	}

	logger.InfoLogger.Println("StatsController: SyncDailyStats completed successfully")
	return nil
}
