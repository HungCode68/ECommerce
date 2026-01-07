package stats

import "net/http"

type StatsHandler interface {

	// Lấy số liệu tổng quan cho Dashboard
	GetDashboardOverview(w http.ResponseWriter, r *http.Request)

	// Lấy danh sách Top sản phẩm bán chạy
	GetTopSellingProducts(w http.ResponseWriter, r *http.Request)

	//  Lấy số liệu thống kê của 1 sản phẩm
	GetProductStats(w http.ResponseWriter, r *http.Request)

	// Chạy thủ công tính toán thống kê 
	SyncDailyStats(w http.ResponseWriter, r *http.Request)
}
