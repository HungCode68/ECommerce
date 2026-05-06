import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type { Category } from '@/api/category.api'

type CreateCategoryRequest = {
  name: string
  slug: string
  description: string
  parent_id?: number | null
  is_active?: boolean
}

type UpdateCategoryRequest = Partial<CreateCategoryRequest>

export const adminCategoryApi = {
  getList: async (params: { q?: string; status?: string; page?: number; limit?: number }) => {
    if (params.q || params.status) {
      const res = await axiosClient.get<ApiResponse<Category[]>>(
        '/api/admin/categories/search',
        { params: { q: params.q, is_active: params.status === 'active' ? true : params.status === 'inactive' ? false : undefined } }
      )
      const data = res.data.data || []
      return {
        categories: data,
        meta: { total: data.length, page: 1, limit: data.length }
      }
    }

    const res = await axiosClient.get<ApiResponse<{ categories: Category[], meta: { total: number, page: number, limit: number } }>>(
      '/api/admin/categories',
      { params: { page: params.page, limit: params.limit } },
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
