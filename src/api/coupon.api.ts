import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type {
  ApplyCouponRequest,
  AvailableCouponsRequest,
  Coupon,
  CouponValidationResult,
  ValidateCouponRequest,
} from '@/types/coupon.types'

const mapBackendToFrontend = (c: any): Coupon => {
  if (!c) return c
  return {
    id: c.id ?? 0,
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

export const couponApi = {
  getAvailable: async (data: AvailableCouponsRequest) => {
    const res = await axiosClient.post<ApiResponse<any[]>>(
      '/api/coupons/available',
      data,
    )
    return (res.data.data ?? []).map(mapBackendToFrontend)
  },

  validate: async (data: ValidateCouponRequest) => {
    const res = await axiosClient.post<ApiResponse<CouponValidationResult>>(
      '/api/coupons/validate',
      data,
    )
    return res.data.data
  },

  apply: async (data: ApplyCouponRequest) => {
    const res = await axiosClient.post<ApiResponse<CouponValidationResult>>(
      '/api/coupons/apply',
      data,
    )
    return res.data.data
  },
}
