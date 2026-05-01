import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@/types/address.types'

export const addressApi = {
  getList: async () => {
    const res = await axiosClient.get<ApiResponse<Address[]>>('/api/addresses')
    return res.data.data
  },

  create: async (data: CreateAddressRequest) => {
    const res = await axiosClient.post<ApiResponse<Address>>(
      '/api/addresses',
      data,
    )
    return res.data.data
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<Address>>(
      `/api/addresses/${id}`,
    )
    return res.data.data
  },

  update: async (id: number, data: UpdateAddressRequest) => {
    const res = await axiosClient.put<ApiResponse<Address>>(
      `/api/addresses/${id}`,
      data,
    )
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosClient.delete(`/api/addresses/${id}`)
  },

  setDefault: async (id: number) => {
    const res = await axiosClient.put<ApiResponse<Address>>(
      `/api/addresses/${id}/default`,
    )
    return res.data.data
  },
}
