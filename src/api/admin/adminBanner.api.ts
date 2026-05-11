import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type { Banner, CreateBannerRequest, UpdateBannerRequest } from '@/types/banner.types'

export const adminBannerApi = {
  getAll: async () => {
    const res = await axiosClient.get<ApiResponse<Banner[]>>('/api/admin/banners')
    return res.data.data
  },

  create: async (data: CreateBannerRequest) => {
    const res = await axiosClient.post<ApiResponse<Banner>>('/api/admin/banners', data)
    return res.data.data
  },

  update: async (id: number, data: UpdateBannerRequest) => {
    const res = await axiosClient.put<ApiResponse<Banner>>(`/api/admin/banners/${id}`, data)
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosClient.delete(`/api/admin/banners/${id}`)
  },
}

