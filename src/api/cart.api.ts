import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type {
  AddToCartRequest,
  Cart,
  CheckoutPreview,
  CheckoutPreviewRequest,
  RemoveCartItemsRequest,
  UpdateCartItemRequest,
} from '@/types/cart.types'

export const cartApi = {
  getCart: async () => {
    const res = await axiosClient.get<ApiResponse<Cart>>('/api/cart')
    return res.data.data
  },

  addItem: async (data: AddToCartRequest) => {
    const res = await axiosClient.post<ApiResponse<Cart>>('/api/cart', data)
    return res.data.data
  },

  updateItem: async (itemId: number, data: UpdateCartItemRequest) => {
    const res = await axiosClient.put<ApiResponse<Cart>>(
      `/api/cart/items/${itemId}`,
      data,
    )
    return res.data.data
  },

  removeItems: async (data: RemoveCartItemsRequest) => {
    const res = await axiosClient.delete<ApiResponse<Cart>>('/api/cart/items', {
      data,
    })
    return res.data.data
  },

  checkoutPreview: async (data: CheckoutPreviewRequest) => {
    const res = await axiosClient.post<ApiResponse<CheckoutPreview>>(
      '/api/cart/checkout-preview',
      data,
    )
    return res.data.data
  },
}
