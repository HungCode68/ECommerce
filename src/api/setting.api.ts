import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type { SystemSettings } from '@/types/setting.types'

export const settingApi = {
  getSettings: async () => {
    const res = await axiosClient.get<ApiResponse<SystemSettings>>('/api/settings')
    return res.data.data
  },

  updateSettings: async (settings: SystemSettings) => {
    const res = await axiosClient.put<ApiResponse<null>>('/api/admin/settings', settings)
    return res.data.data
  },
}
