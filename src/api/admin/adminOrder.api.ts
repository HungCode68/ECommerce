import axiosClient from '@/lib/axiosClient'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  ConfirmPaymentRequest,
  Order,
  OrderFilterParams,
  UpdateOrderStatusRequest,
} from '@/types/order.types'

export const adminOrderApi = {
  getList: async (params: OrderFilterParams) => {
    const res = await axiosClient.get<PaginatedResponse<Order>>(
      '/api/admin/orders',
      { params },
    )
    return res.data
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<Order>>(
      `/api/admin/orders/${id}`,
    )
    return res.data.data
  },

  updateStatus: async (id: number, data: UpdateOrderStatusRequest) => {
    const res = await axiosClient.put<ApiResponse<Order>>(
      `/api/admin/orders/${id}/status`,
      data,
    )
    return res.data.data
  },

  confirmPayment: async (id: number, data: ConfirmPaymentRequest) => {
    const res = await axiosClient.post<ApiResponse<Order>>(
      `/api/admin/orders/${id}/confirm-payment`,
      data,
    )
    return res.data.data
  },
}
