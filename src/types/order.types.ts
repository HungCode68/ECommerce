export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'cod' | 'bank_transfer'

export type OrderItem = {
  id?: number
  order_id?: number
  product_id: number
  variant_id: number
  quantity: number
  price: number
  title?: string
  sku?: string
  unit_price?: number
  line_subtotal?: number
  option_values?: string
  product_name?: string
  variant_info?: string
}

export type OrderPayment = {
  id: number
  method: string
  amount: string | number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  paid_at?: string
  created_at?: string
}

export type Order = {
  id: number
  order_number: string
  user_id: number
  customer_name?: string
  first_item_title?: string
  item_count?: number
  status: OrderStatus
  total_amount: string | number
  subtotal?: number
  shipping_fee?: number
  discount?: number
  payment_status: string
  note?: string
  placed_at: string
  updated_at: string
  paid_at?: string
  completed_at?: string
  cancelled_at?: string
  cancel_reason?: string
  items?: OrderItem[]
  payments?: OrderPayment[]
  // Legacy fields for compatibility
  payment_method?: PaymentMethod
  total_payable?: number
  created_at?: string
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
  is_preorder?: boolean
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
  q?: string
  category_id?: number
}
