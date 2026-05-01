import axiosClient from '@/lib/axiosClient'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CreateReviewRequest,
  Product,
  ProductSearchParams,
  Review,
} from '@/types/product.types'

export const productApi = {
  search: async (params: ProductSearchParams) => {
    const { q, ...rest } = params
    const res = await axiosClient.get<PaginatedResponse<Product>>(
      '/api/products/search',
      {
        params: {
          ...rest,
          name: q?.trim() || undefined,
        },
      },
    )
    return res.data
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<Product>(
      '/api/products/detail/search',
      { params: { id } },
    )
    return res.data
  },

  searchDetail: async (params: ProductSearchParams) => {
    const { q, ...rest } = params
    const res = await axiosClient.get<PaginatedResponse<Product>>(
      '/api/products/detail/search',
      {
        params: {
          ...rest,
          name: q?.trim() || undefined,
        },
      },
    )
    return res.data
  },

  getReviews: async (productId: number) => {
    const res = await axiosClient.get<ApiResponse<Review[]>>(
      `/api/product/${productId}/reviews`,
    )
    return res.data.data
  },

  createReview: async (productId: number, data: CreateReviewRequest) => {
    const res = await axiosClient.post<ApiResponse<Review>>(
      `/api/product/${productId}/reviews`,
      data,
    )
    return res.data.data
  },
}
