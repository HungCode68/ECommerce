package model

import "time"

//  ENTITIES

// SalesSummaryDaily: Thống kê doanh thu tổng hợp theo ngày
type SalesSummaryDaily struct {
	SummaryDate   time.Time `json:"summary_date"   db:"summary_date"`
	TotalOrders   int64     `json:"total_orders"   db:"total_orders"`
	TotalQuantity int64     `json:"total_quantity" db:"total_quantity"`
	TotalRevenue  float64   `json:"total_revenue"  db:"total_revenue"`

	// Số liệu thực tế (chỉ tính đơn Completed)
	RealOrders  int64   `json:"real_orders"    db:"real_orders"`
	RealRevenue float64 `json:"real_revenue"   db:"real_revenue"`

	CreatedAt time.Time `json:"created_at"     db:"created_at"`
}

// ProductSalesDaily: Thống kê hiệu quả bán hàng theo từng sản phẩm/biến thể
type ProductSalesDaily struct {
	ProductID   int64     `json:"product_id"    db:"product_id"`
	VariantID   int64     `json:"variant_id"    db:"variant_id"`
	SummaryDate time.Time `json:"summary_date"  db:"summary_date"`
	UnitsSold   int64     `json:"units_sold"    db:"units_sold"`
	Revenue     float64   `json:"revenue"       db:"revenue"`
	OrderCount  int64     `json:"order_count"   db:"order_count"`
}

// REQUEST / FILTER

// StatsFilter: Dùng để lọc dữ liệu báo cáo
type StatsFilter struct {
	StartDate string `validate:"omitempty,datetime=2006-01-02"` // YYYY-MM-DD
	EndDate   string `validate:"omitempty,datetime=2006-01-02"` // YYYY-MM-DD
	Limit     int    `validate:"omitempty,min=1,max=100"`       // Dùng cho Top Products
}

//  RESPONSES

// ProductDailyStatsResponse: Dùng cho API thống kê của 1 sản phẩm
type ProductDailyStatsResponse struct {
	Date       string  `json:"date"`        // Ngày (YYYY-MM-DD)
	UnitsSold  int64   `json:"units_sold"`  // Số lượng bán
	Revenue    float64 `json:"revenue"`     // Doanh thu
	OrderCount int64   `json:"order_count"` // Số đơn hàng có chứa SP này
}

// Dùng cho API inventory alert / top products
type ProductSalesStatsResponse struct {
	ProductID     int64  `json:"product_id"`
	VariantID     int64  `json:"variant_id"`
	ProductName   string `json:"product_name"`
	VariantTitle  string `json:"variant_title"`
	SKU           string `json:"sku"`
	StockQuantity int    `json:"stock_quantity"`
}

// RevenueChartResponse: điểm dữ liệu doanh thu theo thời gian
type RevenueChartResponse struct {
	Label   string  `json:"label"`
	Revenue float64 `json:"revenue"`
}

// DashboardOverviewResponse: Tổng hợp nhanh cho trang chủ Admin
type DashboardOverviewResponse struct {
	EstimatedRevenue string `json:"estimated_revenue"`
	EstimatedOrders  int64  `json:"estimated_orders"`

	// Số liệu thực tế (Real Revenue)
	RealRevenue string `json:"real_revenue"`
	RealOrders  int64  `json:"real_orders"`
}

// GetDashboardStatsResponse: Response gộp cho Dashboard
type GetDashboardStatsResponse struct {
	TotalRevenue    float64                `json:"total_revenue"`
	RevenueChange   string                 `json:"revenue_change"`
	TotalOrders     int64                  `json:"total_orders"`
	OrdersChange    string                 `json:"orders_change"`
	TotalProducts   int64                  `json:"total_products"`
	LowStockCount   int64                  `json:"low_stock_count"`
	TotalCustomers  int64                  `json:"total_customers"`
	CustomersChange string                 `json:"customers_change"`
	RevenueChart    []RevenueChartResponse `json:"revenue_chart"`
}
