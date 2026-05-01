import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type {
  ApplyCouponRequest,
  AvailableCouponsRequest,
  Coupon,
  CouponValidationResult,
  ValidateCouponRequest,
} from '@/types/coupon.types'

export const couponApi = {
  getAvailable: async (data: AvailableCouponsRequest) => {
    const res = await axiosClient.post<ApiResponse<Coupon[]>>(
      '/api/coupons/available',
      data,
    )
    return res.data.data
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
