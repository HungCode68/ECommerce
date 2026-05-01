import axiosClient from '@/lib/axiosClient'
import type {
  DashboardStats,
  RecentOrder,
  RevenuePoint,
  TopProduct,
} from '@/types/adminStats.types'

type ChartResponse = {
  label: string
  revenue: number
}

type RecentOrderApiItem = {
  id: number
  order_number: string
  customer_name?: string
  first_item_title?: string
  item_count?: number
  total_amount: string
  status: string
  placed_at: string
}

type OrdersResponse = {
  orders: RecentOrderApiItem[]
  total: number
  page?: number
  limit?: number
}

type Period = '1W' | '1M' | '1Y'

function parseMoney(text: string): number {
  const digits = text.replace(/[^\d]/g, '')
  if (!digits) {
    return 0
  }
  return Number(digits)
}

function buildDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date()
  const end = buildDate(now)

  if (period === '1W') {
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    return { start: buildDate(start), end }
  }

  if (period === '1Y') {
    const start = new Date(now.getFullYear(), 0, 1)
    return { start: buildDate(start), end }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { start: buildDate(start), end }
}

function formatChartLabel(dateString: string, period: Period): string {
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  if (period === '1W') {
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    return labels[date.getDay()] ?? dateString
  }

  if (period === '1Y') {
    return `T${date.getMonth() + 1}`
  }

  return date.getDate().toString().padStart(2, '0')
}

function groupChartPoints(points: ChartResponse[], period: Period): RevenuePoint[] {
  if (period !== '1Y') {
    return points.map((point) => ({
      label: formatChartLabel(point.label, period),
      revenue: point.revenue,
    }))
  }

  const grouped = new Map<string, number>()

  points.forEach((point) => {
    const date = new Date(`${point.label}T00:00:00`)
    if (Number.isNaN(date.getTime())) {
      return
    }

    const key = `${date.getFullYear()}-${date.getMonth()}`
    const current = grouped.get(key) ?? 0
    grouped.set(key, current + point.revenue)
  })

  return Array.from(grouped.entries()).map(([key, revenue]) => {
    const [, monthIndex] = key.split('-')
    return {
      label: `T${Number(monthIndex) + 1}`,
      revenue,
    }
  })
}

export const adminStatsApi = {
  async getStats(): Promise<DashboardStats> {
    const res = await axiosClient.get('/api/admin/stats/dashboard')
    return res.data.data as DashboardStats
  },

  async getRevenueChart(period: Period = '1M'): Promise<RevenuePoint[]> {
    const { start, end } = getPeriodRange(period)
    const res = await axiosClient.get('/api/admin/stats/dashboard', {
      params: {
        start_date: start,
        end_date: end,
      },
    })
    const chart = (res.data.data as { revenue_chart?: ChartResponse[] })
      .revenue_chart ?? []
    return groupChartPoints(chart, period)
  },

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const res = await axiosClient.get('/api/admin/stats/top-products', {
      params: { limit },
    })
    return res.data.data as TopProduct[]
  },

  async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    const res = await axiosClient.get('/api/admin/orders', {
      params: { page: 1, limit },
    })
    const payload = res.data.data as OrdersResponse
    return (payload.orders ?? []).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name ?? '',
      first_item_title: order.first_item_title ?? '',
      item_count: order.item_count ?? 0,
      total: parseMoney(order.total_amount),
      status: order.status,
      placed_at: order.placed_at,
    }))
  },

  async syncStats() {
    const res = await axiosClient.post('/api/admin/stats/sync')
    return res.data
  },
}

export const adminAPI = adminStatsApi
