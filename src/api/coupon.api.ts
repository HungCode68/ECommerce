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
    const res = await axiosClient.post<ApiResponse<any>>(
      '/api/coupons/validate',
      data,
    )
    const backendData = res.data.data
    if (backendData && !backendData.is_valid) {
      throw new Error(backendData.message || res.data.message || 'Mã giảm giá không hợp lệ')
    }
    return {
      valid: true,
      discount: backendData?.discount_amount ?? 0,
      message: backendData?.message ?? res.data.message
    } as CouponValidationResult
  },

  apply: async (data: ApplyCouponRequest) => {
    const res = await axiosClient.post<ApiResponse<any>>(
      '/api/coupons/validate', // MUST call validate instead of apply on Cart page
      data,
    )
    const backendData = res.data.data
    if (backendData && !backendData.is_valid) {
      throw new Error(backendData.message || res.data.message || 'Mã giảm giá không hợp lệ')
    }
    return {
      valid: true,
      discount: backendData?.discount_amount ?? 0,
      message: backendData?.message ?? res.data.message
    } as CouponValidationResult
  },
}
