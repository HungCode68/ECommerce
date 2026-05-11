export type CartItem = {
  id: number
  product_id: number
  variant_id: number
  quantity: number
  price: number
  product_name: string
  variant_info: string
  thumbnail_url: string
  stock: number
}

export type Cart = {
  items: CartItem[]
  total: number
}

export type AddToCartRequest = {
  product_id: number
  variant_id: number
  quantity: number
}

export type UpdateCartItemRequest = {
  quantity: number
}

export type RemoveCartItemsRequest = {
  item_ids: number[]
}

export type CheckoutPreviewRequest = {
  selected_variant_ids: number[]
  order_coupon_code?: string
  shipping_coupon_code?: string
}

export type CheckoutPreview = {
  subtotal: number
  shipping_fee: number
  discount: number
  total_payable: number
  applied_order_coupon?: string
  applied_shipping_coupon?: string
}
