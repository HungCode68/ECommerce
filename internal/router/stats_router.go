package router

import (
	"golang/internal/handler/stats"
	"golang/internal/middleware"
	"net/http"
)

func NewStatsRouter(mux *http.ServeMux, statsHandler stats.StatsHandler) http.Handler {
	
	adminGroup := newGroup(mux, "/api/admin/stats", middleware.AdminOnlyMiddleware)

	//  Lấy Dashboard Overview
	adminGroup.HandleFunc("GET", "/dashboard", statsHandler.GetDashboardOverview)

	//  Lấy Top sản phẩm bán chạy
	adminGroup.HandleFunc("GET", "/top-products", statsHandler.GetTopSellingProducts)

	//  Lấy số liệu thống kê của 1 sản phẩm
	adminGroup.HandleFunc("GET", "/products/{id}", statsHandler.GetProductStats)

	//  Sync dữ liệu thủ công
	adminGroup.HandleFunc("POST", "/sync", statsHandler.SyncDailyStats)

	return mux
}