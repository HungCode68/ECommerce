import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@/types/address.types'

type BackendAddress = {
  id: number
  user_id: number
  receiver_name?: string
  receiver_phone?: string
  province?: string
  district?: string
  ward?: string
  address_detail?: string
  is_default?: boolean
  created_at?: string
  recipient_name?: string
  phone?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  country?: string
  is_default_shipping?: boolean
  updated_at?: string
}

function normalizeAddress(address?: BackendAddress | null): Address {
  return {
    id: Number(address?.id ?? 0),
    user_id: Number(address?.user_id ?? 0),
    receiver_name: address?.receiver_name ?? address?.recipient_name ?? '',
    receiver_phone: address?.receiver_phone ?? address?.phone ?? '',
    province: address?.province ?? address?.state ?? '',
    district: address?.district ?? address?.city ?? '',
    ward: address?.ward ?? '',
    address_detail: [address?.address_detail, address?.line1, address?.line2].find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    ) ?? '',
    is_default: Boolean(address?.is_default ?? address?.is_default_shipping),
    created_at: address?.created_at ?? address?.updated_at ?? '',
  }
}

function mapAddressPayload(data: CreateAddressRequest | UpdateAddressRequest) {
  return {
    recipient_name: data.receiver_name,
    phone: data.receiver_phone,
    line1: data.address_detail,
    line2: '',
    city: data.ward || data.district || '',
    state: data.province,
    country: 'Việt Nam',
    is_default_shipping: Boolean(data.is_default),
  }
}

export const addressApi = {
  getList: async () => {
    const res = await axiosClient.get<ApiResponse<BackendAddress[] | { addresses?: BackendAddress[] }>>('/api/addresses')
    const raw = res.data.data
    const list = Array.isArray(raw) ? raw : raw?.addresses ?? []
    return list.map(normalizeAddress)
  },

  create: async (data: CreateAddressRequest) => {
    const res = await axiosClient.post<ApiResponse<BackendAddress>>(
      '/api/addresses',
      mapAddressPayload(data),
    )
    return normalizeAddress(res.data.data)
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<BackendAddress>>(
      `/api/addresses/${id}`,
    )
    return normalizeAddress(res.data.data)
  },

  update: async (id: number, data: UpdateAddressRequest) => {
    const res = await axiosClient.put<ApiResponse<BackendAddress>>(
      `/api/addresses/${id}`,
      mapAddressPayload(data),
    )
    return normalizeAddress(res.data.data)
  },

  delete: async (id: number) => {
    await axiosClient.delete(`/api/addresses/${id}`)
  },

  setDefault: async (id: number) => {
    const res = await axiosClient.put<ApiResponse<BackendAddress | null>>(
      `/api/addresses/${id}/default`,
    )
    return res.data.data ? normalizeAddress(res.data.data) : null
  },
}
