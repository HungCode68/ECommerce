export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipping'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod = 'cod' | 'bank_transfer'

export type OrderItem = {
  product_id: number
  variant_id: number
  quantity: number
  price: number
  product_name?: string
  variant_info?: string
}

export type Order = {
  id: number
  user_id: number
  address_id: number
  items: OrderItem[]
  subtotal: number
  shipping_fee: number
  discount: number
  total_payable: number
  status: OrderStatus
  payment_method: PaymentMethod
  order_coupon_code?: string
  shipping_coupon_code?: string
  note?: string
  cancel_reason?: string
  created_at: string
  updated_at: string
}

export type CreateOrderRequest = {
  address_id: number
  items: {
    product_id: number
    variant_id: number
    quantity: number
  }[]
  order_coupon_code?: string
  shipping_coupon_code?: string
  payment_method: PaymentMethod
  note?: string
}

export type CancelOrderRequest = {
  reason: string
}

export type UpdateOrderStatusRequest = {
  status: OrderStatus
  note?: string
}

export type ConfirmPaymentRequest = {
  payment_method: string
  transaction_id: string
}

export type OrderFilterParams = {
  page?: number
  limit?: number
  status?: OrderStatus
}
