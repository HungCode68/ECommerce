import axiosClient from '@/lib/axiosClient'
import type { PaginatedResponse } from '@/types/api.types'
import type {
  CreateReviewRequest,
  Product,
  ProductReviewSummary,
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

  getDetail: async (idOrSlug: number | string) => {
    const isId = !isNaN(Number(idOrSlug))
    const res = await axiosClient.get<Product>(
      '/api/products/detail/search',
      { params: isId ? { id: idOrSlug } : { slug: idOrSlug } },
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
    const res = await axiosClient.get<ProductReviewSummary>(
      `/api/product/${productId}/reviews`,
    )
    return res.data
  },

  createReview: async (productId: number, data: CreateReviewRequest) => {
    const res = await axiosClient.post<{ review: Review }>(
      `/api/product/${productId}/reviews`,
      data,
    )
    return res.data.review
  },
}
