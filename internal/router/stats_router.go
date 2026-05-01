package router

import (
	"golang/internal/handler/stats"
	"golang/internal/middleware"
	"net/http"
)

func NewStatsRouter(mux *http.ServeMux, statsHandler stats.StatsHandler) http.Handler {

	adminGroup := newGroup(mux, "/api/admin/stats", middleware.AdminOnlyMiddleware)

	// Dashboard tổng hợp (Gộp Overview + Top Products)
	adminGroup.HandleFunc("GET", "/dashboard", statsHandler.GetDashboardStats)

	// Top sản phẩm bán chạy
	adminGroup.HandleFunc("GET", "/top-products", statsHandler.GetTopSellingProducts)

	// Optional (detail)
	adminGroup.HandleFunc("GET", "/products/{id}", statsHandler.GetProductStats)

	// Sync dữ liệu
	adminGroup.HandleFunc("POST", "/sync", statsHandler.SyncDailyStats)

	return mux
}
