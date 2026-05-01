import axiosClient from '@/lib/axiosClient'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
} from '@/types/coupon.types'

export const adminCouponApi = {
  getList: async (params: { page: number; limit: number }) => {
    const res = await axiosClient.get<PaginatedResponse<Coupon>>(
      '/api/admin/coupons',
      { params },
    )
    return res.data
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<Coupon>>(
      `/api/admin/coupons/${id}`,
    )
    return res.data.data
  },

  create: async (data: CreateCouponRequest) => {
    const res = await axiosClient.post<ApiResponse<Coupon>>(
      '/api/admin/coupons',
      data,
    )
    return res.data.data
  },

  update: async (id: number, data: UpdateCouponRequest) => {
    const res = await axiosClient.put<ApiResponse<Coupon>>(
      `/api/admin/coupons/${id}`,
      data,
    )
    return res.data.data
  },

  deleteOne: async (id: number) => {
    await axiosClient.delete(`/api/admin/coupons/${id}`)
  },

  deleteMany: async (ids: number[]) => {
    await axiosClient.delete('/api/admin/coupons', { data: { ids } })
  },
}
