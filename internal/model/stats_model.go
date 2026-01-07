package model

import "time"

//  ENTITIES 

// SalesSummaryDaily: Thống kê doanh thu tổng hợp theo ngày
type SalesSummaryDaily struct {
	SummaryDate  time.Time `json:"summary_date"   db:"summary_date"`
	TotalOrders  int64     `json:"total_orders"   db:"total_orders"`
	TotalQuantity int64    `json:"total_quantity" db:"total_quantity"`
	TotalRevenue float64   `json:"total_revenue"  db:"total_revenue"`
	
	// Số liệu thực tế (chỉ tính đơn Completed)
	RealOrders   int64     `json:"real_orders"    db:"real_orders"`
	RealRevenue  float64   `json:"real_revenue"   db:"real_revenue"`
	
	CreatedAt    time.Time `json:"created_at"     db:"created_at"`
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
	Date        string  `json:"date"`         // Ngày (YYYY-MM-DD)
	UnitsSold   int64   `json:"units_sold"`   // Số lượng bán
	Revenue     float64 `json:"revenue"`      // Doanh thu 
	OrderCount  int64   `json:"order_count"`  // Số đơn hàng có chứa SP này
}


//  Dùng cho API Top sản phẩm bán chạy
type ProductSalesStatsResponse struct {
	ProductID    int64   `json:"product_id"`
	VariantID    int64   `json:"variant_id"`
	ProductName  string  `json:"product_name"` // Join từ bảng products
	VariantTitle string  `json:"variant_title"` // Join từ bảng product_variants
	SKU          string  `json:"sku"`
	TotalUnitsSold int64   `json:"total_units_sold"`
	TotalRevenue   float64 `json:"total_revenue"` 
	TotalOrders    int64   `json:"total_orders"`
}

// DashboardOverviewResponse: Tổng hợp nhanh cho trang chủ Admin
type DashboardOverviewResponse struct {
	EstimatedRevenue string `json:"estimated_revenue"`
	EstimatedOrders  int64  `json:"estimated_orders"`

	// Số liệu thực tế (Real Revenue)
	RealRevenue      string `json:"real_revenue"`
	RealOrders       int64  `json:"real_orders"`
}