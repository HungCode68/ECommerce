import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type { Banner } from '@/types/banner.types'

export const bannerApi = {
  getActive: async (position?: string) => {
    const res = await axiosClient.get<ApiResponse<Banner[]>>('/api/banners', {
      params: { position },
    })
    return res.data.data
  },
}

