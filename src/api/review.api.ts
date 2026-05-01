import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type { CreateReviewRequest, Review } from '@/types/product.types'

export const reviewApi = {
  getByProduct: async (productId: number) => {
    const res = await axiosClient.get<ApiResponse<Review[]>>(
      `/api/product/${productId}/reviews`,
    )
    return res.data.data
  },

  create: async (productId: number, data: CreateReviewRequest) => {
    const res = await axiosClient.post<ApiResponse<Review>>(
      `/api/product/${productId}/reviews`,
      data,
    )
    return res.data.data
  },
}
