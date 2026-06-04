import axiosClient from '@/lib/axiosClient'
import { ApiResponse, PaginatedResponse } from '@/types/api.types'
import { Notification, NotificationUnreadCountResponse } from '@/types/notification.types'

export const notificationApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const res = await axiosClient.get<ApiResponse<{ data: Notification[], pagination: any }>>('/api/notifications', { params })
    return {
      code: res.data.code,
      message: res.data.message,
      data: res.data.data.data,
      pagination: res.data.data.pagination,
      errors: res.data.errors
    } as PaginatedResponse<Notification>
  },

  getUnreadCount: async () => {
    const res = await axiosClient.get<ApiResponse<NotificationUnreadCountResponse>>('/api/notifications/unread-count')
    return res.data
  },

  markAsRead: async (id: number) => {
    const res = await axiosClient.put<ApiResponse<null>>(`/api/notifications/${id}/read`)
    return res.data
  },

  markAllAsRead: async () => {
    const res = await axiosClient.put<ApiResponse<null>>('/api/notifications/read-all')
    return res.data
  },
}
