import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export type Category = {
  id: number
  name: string
  slug: string
  description?: string
  image?: string
  parent_id?: number | null
  status?: 'active' | 'inactive'
  product_count?: number
  created_at?: string
}

export const categoryApi = {
  getAll: async () => {
    const res = await axiosClient.get<ApiResponse<Category[]>>('/api/categories')
    return res.data.data
  },

  search: async (q: string) => {
    const res = await axiosClient.get<ApiResponse<Category[]>>(
      '/api/categories/search',
      { params: { q } },
    )
    return res.data.data
  },
}
