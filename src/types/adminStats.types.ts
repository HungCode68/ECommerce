export type RevenuePoint = {
  label: string
  revenue: number
}

export type DashboardStats = {
  total_revenue: number
  revenue_change: string
  total_orders: number
  orders_change: string
  total_products: number
  low_stock_count: number
  total_customers: number
  customers_change: string
  revenue_chart: RevenuePoint[]
}

export type TopProduct = {
  product_id: number
  variant_id: number
  product_name: string
  variant_title: string
  sku: string
  stock_quantity: number
}

export type RecentOrder = {
  id: number
  order_number: string
  customer_name: string
  first_item_title: string
  all_item_titles: string
  item_count: number
  total: number
  status: string
  placed_at: string
}

export type ReportSummary = {
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  estimated_revenue: number
  real_revenue: number
}

export type RevenueReportRow = {
  label: string
  total_orders: number
  estimated_revenue: number
  real_revenue: number
}

export type ProductSalesReportRow = {
  product_name: string
  variant_title: string
  units_sold: number
  revenue: number
}

export type ReportDataResponse = {
  summary: ReportSummary
  revenue_by_time: RevenueReportRow[]
  product_sales: ProductSalesReportRow[]
}
