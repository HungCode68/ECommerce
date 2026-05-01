import axiosClient from '@/lib/axiosClient'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Category } from '@/api/category.api'

type CreateCategoryRequest = {
  name: string
  slug: string
  description: string
  parent_id?: number | null
  status?: string
}

type UpdateCategoryRequest = Partial<CreateCategoryRequest>

export const adminCategoryApi = {
  getList: async (params: { q?: string; status?: string; page?: number; limit?: number }) => {
    const res = await axiosClient.get<ApiResponse<{ categories: Category[], meta: { total: number, page: number, limit: number } }>>(
      '/api/admin/categories',
      { params },
    )
    return res.data.data
  },

  search: async (q: string) => {
    const res = await axiosClient.get<ApiResponse<Category[]>>(
      '/api/admin/categories/search',
      { params: { q } },
    )
    return res.data.data
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<Category>>(
      `/api/admin/categories/${id}`,
    )
    return res.data.data
  },

  create: async (data: CreateCategoryRequest) => {
    const res = await axiosClient.post<ApiResponse<Category>>(
      '/api/admin/categories',
      data,
    )
    return res.data.data
  },

  update: async (id: number, data: UpdateCategoryRequest) => {
    const res = await axiosClient.put<ApiResponse<Category>>(
      `/api/admin/categories/${id}`,
      data,
    )
    return res.data.data
  },

  softDelete: async (ids: number[]) => {
    await axiosClient.delete('/api/admin/categories', { data: { ids } })
  },

  hardDelete: async (id: number) => {
    await axiosClient.delete(`/api/admin/categories/hard/${id}`)
  },
}
