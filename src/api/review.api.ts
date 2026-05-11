import axiosClient from '@/lib/axiosClient'
import type { CreateReviewRequest, ProductReviewSummary, Review } from '@/types/product.types'
import type { ApiResponse } from '@/types/api.types'

type UploadImageResponse = {
  url: string
}

export const reviewApi = {
  getByProduct: async (productId: number) => {
    const res = await axiosClient.get<ProductReviewSummary>(
      `/api/product/${productId}/reviews`,
    )
    return res.data
  },

  create: async (productId: number, data: CreateReviewRequest) => {
    const res = await axiosClient.post<{ review: Review }>(
      `/api/product/${productId}/reviews`,
      data,
    )
    return res.data.review
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
}
