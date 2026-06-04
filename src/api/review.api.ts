import axiosClient from '@/lib/axiosClient'
import type { CreateReviewRequest, ProductReviewSummary, Review } from '@/types/product.types'
import type { ApiResponse } from '@/types/api.types'

type UploadImageResponse = {
  url: string
}

export const reviewApi = {
  getByProduct: async (productId: number) => {
    const res = await axiosClient.get<ApiResponse<ProductReviewSummary>>(
      `/api/product/${productId}/reviews`,
    )
    return res.data.data
  },

  create: async (productId: number, data: CreateReviewRequest) => {
    const res = await axiosClient.post<ApiResponse<{ review: Review }>>(
      `/api/product/${productId}/reviews`,
      data,
    )
    return res.data.data.review
  },

  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await axiosClient.post<ApiResponse<UploadImageResponse>>(
      '/api/product/reviews/upload-image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return res.data.data.url
  },

  getByOrder: async (productId: number, orderId: number) => {
    const res = await axiosClient.get<ApiResponse<Review>>(
      `/api/product/${productId}/reviews/order/${orderId}`
    )
    return res.data.data
  },

  update: async (productId: number, reviewId: number, data: Omit<CreateReviewRequest, 'order_id'>) => {
    const res = await axiosClient.put<ApiResponse<Review>>(
      `/api/product/${productId}/reviews/${reviewId}`,
      data
    )
    return res.data.data
  },

  delete: async (productId: number, reviewId: number) => {
    const res = await axiosClient.delete<ApiResponse<null>>(
      `/api/product/${productId}/reviews/${reviewId}`
    )
    return res.data
  },

  adminGetAll: async (params?: { page?: number; limit?: number }) => {
    const res = await axiosClient.get<ApiResponse<{ data: Review[]; pagination: any }>>('/api/admin/reviews', { params })
    return res.data.data
  },

  adminReply: async (reviewId: number, reply: string) => {
    const res = await axiosClient.put<ApiResponse<null>>(`/api/admin/reviews/${reviewId}/reply`, { reply })
    return res.data
  },

  adminDelete: async (reviewId: number, reason: string) => {
    const res = await axiosClient.delete<ApiResponse<null>>(`/api/admin/reviews/${reviewId}`, {
      data: { reason }
    })
    return res.data
  },
}
