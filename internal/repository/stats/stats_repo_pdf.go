package stats

import (
	"context"
	"fmt"
	"golang/internal/logger"
	"golang/internal/model"
)

// GetPDFReportData: Lấy dữ liệu báo cáo PDF
func (r *StatsRepository) GetPDFReportData(ctx context.Context, req model.GetPDFReportRequest) (*model.ReportDataResponse, error) {
	logger.DebugLogger.Printf("StatsRepo: Starting GetPDFReportData. Request: %+v", req)

	var startStr, endStr string
	if req.Type == "month" {
		startStr = fmt.Sprintf("%04d-%02d-01", req.Year, req.Month)
		// Lấy ngày cuối cùng của tháng
		endStr = fmt.Sprintf("%04d-%02d-31", req.Year, req.Month) // MySQL DATE() handles invalid days like 31 for Feb safely in some contexts, but it's better to use LAST_DAY
		endStrQuery := fmt.Sprintf("LAST_DAY('%s')", startStr)
		startStr = fmt.Sprintf("'%s'", startStr)
		_ = endStrQuery
	} else if req.Type == "year" {
		startStr = fmt.Sprintf("'%04d-01-01'", req.Year)
		endStr = fmt.Sprintf("'%04d-12-31'", req.Year)
	} else {
		return nil, fmt.Errorf("invalid report type")
	}

	var startStrFilter string
	if req.Type == "month" {
		startStrFilter = fmt.Sprintf("%04d-%02d-01", req.Year, req.Month)
	} else if req.Type == "year" {
		startStrFilter = fmt.Sprintf("%04d-01-01", req.Year)
	}

	resp := &model.ReportDataResponse{}

	// 1. Lấy Summary
	// Tổng đơn hàng (không tính bị huỷ)
	var estOrd, estRev float64
	var cancelledOrd float64
	var realOrd, realRev float64

	// Estimated (Không tính cancelled)
	queryEst := fmt.Sprintf(`
		SELECT 
			COALESCE(COUNT(id), 0), 
			COALESCE(SUM(total_amount), 0)
		FROM orders 
		WHERE DATE(placed_at) >= %s AND DATE(placed_at) <= %s
		AND status != 'cancelled'`, startStr, endStr)
	if req.Type == "month" {
		queryEst = fmt.Sprintf(`
		SELECT 
			COALESCE(COUNT(id), 0), 
			COALESCE(SUM(total_amount), 0)
		FROM orders 
		WHERE DATE(placed_at) >= '%s' AND DATE(placed_at) <= LAST_DAY('%s')
		AND status != 'cancelled'`, startStrFilter, startStrFilter)
	}
	err := r.db.QueryRowContext(ctx, queryEst).Scan(&estOrd, &estRev)
	if err != nil {
		return nil, err
	}

	// Cancelled
	queryCancelled := fmt.Sprintf(`
		SELECT COALESCE(COUNT(id), 0)
		FROM orders 
		WHERE DATE(placed_at) >= %s AND DATE(placed_at) <= %s
		AND status = 'cancelled'`, startStr, endStr)
	if req.Type == "month" {
		queryCancelled = fmt.Sprintf(`
		SELECT COALESCE(COUNT(id), 0)
		FROM orders 
		WHERE DATE(placed_at) >= '%s' AND DATE(placed_at) <= LAST_DAY('%s')
		AND status = 'cancelled'`, startStrFilter, startStrFilter)
	}
	err = r.db.QueryRowContext(ctx, queryCancelled).Scan(&cancelledOrd)
	if err != nil {
		return nil, err
	}

	// Real
	queryReal := fmt.Sprintf(`
		SELECT 
			COALESCE(COUNT(id), 0), 
			COALESCE(SUM(total_amount), 0)
		FROM orders 
		WHERE DATE(placed_at) >= %s AND DATE(placed_at) <= %s
		AND payment_status = 'paid'`, startStr, endStr)
	if req.Type == "month" {
		queryReal = fmt.Sprintf(`
		SELECT 
			COALESCE(COUNT(id), 0), 
			COALESCE(SUM(total_amount), 0)
		FROM orders 
		WHERE DATE(placed_at) >= '%s' AND DATE(placed_at) <= LAST_DAY('%s')
		AND payment_status = 'paid'`, startStrFilter, startStrFilter)
	}
	err = r.db.QueryRowContext(ctx, queryReal).Scan(&realOrd, &realRev)
	if err != nil {
		return nil, err
	}

	totalOrders := int64(estOrd) + int64(cancelledOrd)

	resp.Summary = model.ReportSummary{
		TotalOrders:      totalOrders,
		CompletedOrders:  int64(realOrd),
		CancelledOrders:  int64(cancelledOrd),
		EstimatedRevenue: estRev,
		RealRevenue:      realRev,
	}

	// 2. Lấy Revenue By Time
	var queryRevenueByTime string
	if req.Type == "month" {
		queryRevenueByTime = fmt.Sprintf(`
			SELECT 
				DATE_FORMAT(placed_at, '%%Y-%%m-%%d') as label,
				COUNT(id) as total_orders,
				SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as estimated_revenue,
				SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as real_revenue
			FROM orders
			WHERE DATE(placed_at) >= '%s' AND DATE(placed_at) <= LAST_DAY('%s')
			GROUP BY label
			ORDER BY label ASC
		`, startStrFilter, startStrFilter)
	} else {
		queryRevenueByTime = fmt.Sprintf(`
			SELECT 
				DATE_FORMAT(placed_at, '%%Y-%%m') as label,
				COUNT(id) as total_orders,
				SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as estimated_revenue,
				SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as real_revenue
			FROM orders
			WHERE DATE(placed_at) >= %s AND DATE(placed_at) <= %s
			GROUP BY label
			ORDER BY label ASC
		`, startStr, endStr)
	}

	rows, err := r.db.QueryContext(ctx, queryRevenueByTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var row model.RevenueReportRow
		var tOrders float64
		if err := rows.Scan(&row.Label, &tOrders, &row.EstimatedRevenue, &row.RealRevenue); err != nil {
			return nil, err
		}
		row.TotalOrders = int64(tOrders)
		resp.RevenueByTime = append(resp.RevenueByTime, row)
	}

	// 3. Lấy Product Sales
	var queryProductSales string
	if req.Type == "month" {
		queryProductSales = fmt.Sprintf(`
			SELECT 
				p.name,
				COALESCE(v.title, ''),
				SUM(oi.quantity),
				SUM(oi.line_subtotal)
			FROM order_items oi
			JOIN orders o ON o.id = oi.order_id
			JOIN products p ON p.id = oi.product_id
			LEFT JOIN product_variants v ON v.id = oi.variant_id
			WHERE DATE(o.placed_at) >= '%s' AND DATE(o.placed_at) <= LAST_DAY('%s')
			AND o.status != 'cancelled'
			GROUP BY oi.product_id, oi.variant_id
			ORDER BY SUM(oi.quantity) DESC
		`, startStrFilter, startStrFilter)
	} else {
		queryProductSales = fmt.Sprintf(`
			SELECT 
				p.name,
				COALESCE(v.title, ''),
				SUM(oi.quantity),
				SUM(oi.line_subtotal)
			FROM order_items oi
			JOIN orders o ON o.id = oi.order_id
			JOIN products p ON p.id = oi.product_id
			LEFT JOIN product_variants v ON v.id = oi.variant_id
			WHERE DATE(o.placed_at) >= %s AND DATE(o.placed_at) <= %s
			AND o.status != 'cancelled'
			GROUP BY oi.product_id, oi.variant_id
			ORDER BY SUM(oi.quantity) DESC
		`, startStr, endStr)
	}

	rowsProd, err := r.db.QueryContext(ctx, queryProductSales)
	if err != nil {
		return nil, err
	}
	defer rowsProd.Close()

	for rowsProd.Next() {
		var pRow model.ProductSalesReportRow
		var uSold float64
		if err := rowsProd.Scan(&pRow.ProductName, &pRow.VariantTitle, &uSold, &pRow.Revenue); err != nil {
			return nil, err
		}
		pRow.UnitsSold = int64(uSold)
		resp.ProductSales = append(resp.ProductSales, pRow)
	}

	return resp, nil
}
