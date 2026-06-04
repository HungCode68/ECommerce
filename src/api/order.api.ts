import axiosClient from '@/lib/axiosClient'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CancelOrderRequest,
  CreateOrderRequest,
  Order,
  OrderFilterParams,
} from '@/types/order.types'

export const orderApi = {
  create: async (data: CreateOrderRequest) => {
    const res = await axiosClient.post<ApiResponse<Order>>('/api/orders', data)
    return res.data.data
  },

  getList: async (params: OrderFilterParams) => {
    const res = await axiosClient.get<PaginatedResponse<Order>>('/api/orders', {
      params,
    })
    return res.data
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<Order>>(`/api/orders/${id}`)
    return res.data.data
  },
  // New method to fetch order by order code (string)
  getDetailByCode: async (code: string) => {
    const res = await axiosClient.get<ApiResponse<Order>>(`/api/orders/code/${code}`)
    return res.data.data
  },

  cancel: async (id: number, data: CancelOrderRequest) => {
    const res = await axiosClient.post<ApiResponse<Order>>(
      `/api/orders/${id}/cancel`,
      data,
    )
    return res.data.data
  },

  confirmTransferred: async (id: number) => {
    const res = await axiosClient.post<ApiResponse<any>>(`/api/orders/${id}/transferred`)
    return res.data
  },
}
