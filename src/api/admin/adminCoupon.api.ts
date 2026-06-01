import axiosClient from '@/lib/axiosClient'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
} from '@/types/coupon.types'

const mapBackendToFrontend = (c: any): Coupon => {
  if (!c) return c
  return {
    id: c.id,
    code: c.code,
    type: c.discount_type === 'percentage' ? 'percent' : 'fixed',
    value: c.discount_value ?? 0,
    min_order_amount: c.min_order_value ?? 0,
    max_usage: c.usage_limit ?? 0,
    max_usage_per_user: c.user_usage_limit ?? 1,
    used_count: c.usage_count ?? 0,
    expired_at: c.end_date ?? c.expired_at ?? '',
    created_at: c.created_at ?? '',
  }
}

const mapFrontendToBackend = (data: any) => {
  return {
    code: data.code,
    description: `Mã giảm giá ${data.code}`,
    discount_type: data.type === 'percent' ? 'percentage' : 'fixed_amount',
    discount_value: Number(data.value),
    min_order_value: Number(data.min_order_amount ?? 0),
    usage_limit: Number(data.max_usage),
    user_usage_limit: Number(data.max_usage_per_user ?? 1),
    is_active: true,
    start_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
    end_date: data.expired_at ? new Date(data.expired_at).toISOString().replace('T', ' ').slice(0, 19) : undefined,
  }
}

export const adminCouponApi = {
  getList: async (params: { page: number; limit: number }) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      '/api/admin/coupons',
      { params },
    )
    return {
      ...res.data,
      data: (res.data.data ?? []).map(mapBackendToFrontend),
    }
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<any>>(
      `/api/admin/coupons/${id}`,
    )
    return mapBackendToFrontend(res.data.data)
  },

  create: async (data: CreateCouponRequest) => {
    const backendData = mapFrontendToBackend(data)
    const res = await axiosClient.post<ApiResponse<any>>(
      '/api/admin/coupons',
      backendData,
    )
    return mapBackendToFrontend(res.data.data)
  },

  update: async (id: number, data: UpdateCouponRequest) => {
    const backendData = mapFrontendToBackend(data)
    const res = await axiosClient.put<ApiResponse<any>>(
      `/api/admin/coupons/${id}`,
      backendData,
    )
    return mapBackendToFrontend(res.data.data)
  },

  deleteOne: async (id: number) => {
    await axiosClient.delete(`/api/admin/coupons/${id}`)
  },

  deleteMany: async (ids: number[]) => {
    await axiosClient.delete('/api/admin/coupons', { data: { ids } })
  },
}
