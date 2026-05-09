import axiosClient from '@/lib/axiosClient'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CreateProductRequest,
  CreateVariantRequest,
  CreateVariantResponse,
  Product,
  ProductHistory,
  ProductHistoryGroup,
  Review,
  UpdateProductRequest,
  UpdateVariantRequest,
  UpdateVariantResponse,
} from '@/types/product.types'

type AdminProductListParams = {
  page: number
  limit: number
  q?: string
  category_id?: number
}

export const adminProductApi = {
  create: async (data: CreateProductRequest) => {
    const res = await axiosClient.post<ApiResponse<Product>>(
      '/api/admin/product',
      data,
    )
    return res.data.data
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<Product>>(
      `/api/admin/product/${id}`,
    )
    return res.data.data
  },

  getAll: async (params: AdminProductListParams) => {
    const res = await axiosClient.post<PaginatedResponse<Product>>(
      '/api/admin/products',
      params,
    )
    return res.data
  },

  getAllPaged: async (params: AdminProductListParams) => {
    const res = await axiosClient.get<PaginatedResponse<Product>>(
      '/api/admin/product/all',
      { params },
    )
    return res.data
  },

  update: async (id: number, data: UpdateProductRequest) => {
    const res = await axiosClient.put<ApiResponse<Product>>(
      `/api/admin/product/update/${id}`,
      data,
    )
    return res.data.data
  },

  search: async (params: AdminProductListParams) => {
    const res = await axiosClient.get<PaginatedResponse<Product>>(
      '/api/admin/product/search',
      { params },
    )
    return res.data
  },

  importCsv: async (file: File) => {
    const formData = new FormData()
    formData.append('csv_file', file)
    const res = await axiosClient.post<ApiResponse<{ total_created: number; errors: string[] }>>(
      '/api/admin/products/import-csv',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return res.data.data
  },

  getDeleted: async (params: { page: number; limit: number }) => {
    const res = await axiosClient.get<PaginatedResponse<Product>>(
      '/api/admin/products/deleted',
      { params },
    )
    return res.data
  },

  softDelete: async (ids: number[]) => {
    await axiosClient.post('/api/admin/products/delesoft', { ids })
  },

  hardDeleteAll: async () => {
    await axiosClient.delete('/api/admin/products/deleall')
  },

  // Variants
  createVariant: async (productId: number, data: CreateVariantRequest) => {
    const res = await axiosClient.post<CreateVariantResponse>(
      `/api/admin/product/${productId}/variant`,
      data,
    )
    return res.data.variant
  },

  updateVariant: async (
    productId: number,
    variantId: number,
    data: UpdateVariantRequest,
  ) => {
    const res = await axiosClient.put<UpdateVariantResponse>(
      `/api/admin/product/${productId}/variant/${variantId}`,
      data,
    )
    return res.data.variant
  },

  deleteVariant: async (productId: number, variantId: number) => {
    await axiosClient.delete(
      `/api/admin/product/${productId}/variant/${variantId}`,
    )
  },

  // History
  getHistory: async (productId?: number) => {
    const res = await axiosClient.get<ProductHistoryGroup[]>(
      '/api/admin/product/history',
      { params: { id: productId } },
    )
    return res.data
  },

  getAllHistory: async (params: { page: number; limit: number }) => {
    const res = await axiosClient.get<PaginatedResponse<ProductHistory>>(
      '/api/admin/product/history/all',
      { params },
    )
    return res.data
  },

  // Reviews
  getProductReviews: async (productId: number) => {
    const res = await axiosClient.get<ApiResponse<Review[]>>(
      `/api/admin/product/${productId}/reviews`,
    )
    return res.data.data
  },

  deleteReview: async (reviewId: number) => {
    await axiosClient.delete(`/api/admin/product/reviews/${reviewId}`)
  },
}
