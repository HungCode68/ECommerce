package stats

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"golang/internal/logger"
	"golang/internal/model"
	orderRepo "golang/internal/repository/order"
	repository "golang/internal/repository/stats"
	userRepo "golang/internal/repository/user"
)

type statsController struct {
	StatsRepo repository.IStatsRepository
	OrderRepo orderRepo.IOrderRepository
	UserRepo  userRepo.UserRepo
}

func NewStatsController(repo repository.IStatsRepository, orderRepo orderRepo.IOrderRepository, userRepo userRepo.UserRepo) StatsController {
	return &statsController{
		StatsRepo: repo,
		OrderRepo: orderRepo,
		UserRepo:  userRepo,
	}
}

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

func (c *statsController) GetDashboardStats(ctx context.Context, filter model.StatsFilter) (*model.GetDashboardStatsResponse, error) {
	logger.DebugLogger.Printf("StatsController: Starting GetDashboardStats. Filter: %+v", filter)

	now := time.Now()
	revenueFilter := normalizeFilter(filter, monthStart(now), now)
	ordersFilter := normalizeFilter(filter, dayStart(now), now)

	currentRevenueOverview, err := c.StatsRepo.GetDashboardOverview(ctx, revenueFilter)
	if err != nil {
		return nil, err
	}

	currentOrdersOverview, err := c.StatsRepo.GetDashboardOverview(ctx, ordersFilter)
	if err != nil {
		return nil, err
	}

	prevRevenueFilter := previousPeriodFilter(revenueFilter)
	prevOrdersFilter := previousPeriodFilter(ordersFilter)

	prevRevenueOverview, err := c.StatsRepo.GetDashboardOverview(ctx, prevRevenueFilter)
	if err != nil {
		return nil, err
	}
	prevOrdersOverview, err := c.StatsRepo.GetDashboardOverview(ctx, prevOrdersFilter)
	if err != nil {
		return nil, err
	}

	chart, err := c.StatsRepo.GetRevenueChart(ctx, revenueFilter)
	if err != nil {
		return nil, err
	}

	totalProducts, lowStockCount, err := c.StatsRepo.GetProductCatalogSummary(ctx, 5)
	if err != nil {
		return nil, err
	}

	users, err := c.UserRepo.GetAllUsers()
	if err != nil {
		return nil, err
	}

	totalCustomers := int64(0)
	currentCustomerCount := 0
	prevCustomerCount := 0
	currentStart, currentEnd := parseRange(revenueFilter)
	prevStart, prevEnd := parseRange(prevRevenueFilter)
	for _, u := range users {
		if u.DeletedAt != nil || !u.IsActive || u.Role != "user" {
			continue
		}
		totalCustomers++
		if inRange(u.CreatedAt, currentStart, currentEnd) {
			currentCustomerCount++
		}
		if inRange(u.CreatedAt, prevStart, prevEnd) {
			prevCustomerCount++
		}
	}

	revenueTotal := parseVND(currentRevenueOverview.RealRevenue)
	if revenueTotal == 0 {
		revenueTotal = parseVND(currentRevenueOverview.EstimatedRevenue)
	}

	prevRevenueTotal := parseVND(prevRevenueOverview.RealRevenue)
	if prevRevenueTotal == 0 {
		prevRevenueTotal = parseVND(prevRevenueOverview.EstimatedRevenue)
	}

	currentOrders := currentOrdersOverview.EstimatedOrders
	prevOrders := prevOrdersOverview.EstimatedOrders

	resp := &model.GetDashboardStatsResponse{
		TotalRevenue:    revenueTotal,
		RevenueChange:   percentChangeText(revenueTotal, prevRevenueTotal),
		TotalOrders:     currentOrders,
		OrdersChange:    percentChangeText(float64(currentOrders), float64(prevOrders)),
		TotalProducts:   totalProducts,
		LowStockCount:   lowStockCount,
		TotalCustomers:  totalCustomers,
		CustomersChange: percentChangeText(float64(currentCustomerCount), float64(prevCustomerCount)),
		RevenueChart:    chart,
	}

	logger.InfoLogger.Println("StatsController: GetDashboardStats success")
	return resp, nil
}

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

func (c *statsController) GetProductStats(ctx context.Context, productID int64, filter model.StatsFilter) ([]model.ProductDailyStatsResponse, error) {
	logger.DebugLogger.Printf("StatsController: Starting GetProductStats. ID: %d", productID)

	resp, err := c.StatsRepo.GetProductStats(ctx, productID, filter)
	if err != nil {
		logger.ErrorLogger.Printf("StatsController: GetProductStats failed: %v", err)
		return nil, err
	}

	return resp, nil
}

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

func normalizeFilter(filter model.StatsFilter, defaultStart time.Time, defaultEnd time.Time) model.StatsFilter {
	if filter.StartDate != "" && filter.EndDate != "" {
		return filter
	}
	filter.StartDate = defaultStart.Format("2006-01-02")
	filter.EndDate = defaultEnd.Format("2006-01-02")
	return filter
}

func previousPeriodFilter(filter model.StatsFilter) model.StatsFilter {
	start, end, err := parseFilterRange(filter)
	if err != nil {
		return filter
	}

	days := int(end.Sub(start).Hours()/24) + 1
	if days < 1 {
		days = 1
	}

	prevEnd := start.AddDate(0, 0, -1)
	prevStart := prevEnd.AddDate(0, 0, -(days - 1))

	return model.StatsFilter{
		StartDate: prevStart.Format("2006-01-02"),
		EndDate:   prevEnd.Format("2006-01-02"),
		Limit:     filter.Limit,
	}
}

func parseRange(filter model.StatsFilter) (time.Time, time.Time) {
	start, end, err := parseFilterRange(filter)
	if err != nil {
		now := time.Now()
		return dayStart(now), now
	}
	return start, end
}

func parseFilterRange(filter model.StatsFilter) (time.Time, time.Time, error) {
	if filter.StartDate == "" || filter.EndDate == "" {
		return time.Time{}, time.Time{}, errors.New("missing range")
	}

	start, err := time.ParseInLocation("2006-01-02", filter.StartDate, time.Local)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	end, err := time.ParseInLocation("2006-01-02", filter.EndDate, time.Local)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	end = end.Add(24*time.Hour - time.Nanosecond)
	return start, end, nil
}

func monthStart(now time.Time) time.Time {
	return time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
}

func dayStart(now time.Time) time.Time {
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
}

func inRange(t time.Time, start, end time.Time) bool {
	return !t.Before(start) && !t.After(end)
}

func parseVND(value string) float64 {
	if value == "" {
		return 0
	}

	digits := strings.Builder{}
	for _, r := range value {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}

	if digits.Len() == 0 {
		return 0
	}

	parsed, err := strconv.ParseFloat(digits.String(), 64)
	if err != nil {
		return 0
	}
	return parsed
}

func percentChangeText(current, previous float64) string {
	if previous == 0 {
		if current == 0 {
			return "0%"
		}
		return "+100%"
	}

	change := ((current - previous) / previous) * 100
	sign := ""
	if change > 0 {
		sign = "+"
	}
	return fmt.Sprintf("%s%.0f%%", sign, change)
}
