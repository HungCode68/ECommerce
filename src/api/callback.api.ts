import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type { CallbackRequest } from '@/types/callback.types'

export const callbackApi = {
  create: async (phoneNumber: string) => {
    const res = await axiosClient.post<ApiResponse<CallbackRequest>>('/api/callback-requests', {
      phone_number: phoneNumber,
    })
    return res.data.data
  },

  getAll: async (params?: { status?: string; page?: number; page_size?: number }) => {
    const res = await axiosClient.get<ApiResponse<CallbackRequest[]>>('/api/admin/callback-requests', {
      params,
    })
    // Check if there is pagination meta in response
    return {
      list: res.data.data,
      meta: (res.data as any).meta as { total: number; page: number; page_size: number },
    }
  },

  updateStatus: async (id: number, status: 'pending' | 'completed' | 'cancelled') => {
    const res = await axiosClient.put<ApiResponse<CallbackRequest>>(`/api/admin/callback-requests/${id}`, {
      status,
    })
    return res.data.data
  },

  delete: async (id: number) => {
    const res = await axiosClient.delete<ApiResponse<null>>(`/api/admin/callback-requests/${id}`)
    return res.data.data
  },
}
