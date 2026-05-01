export type CouponType = 'percent' | 'fixed'

export type Coupon = {
  id: number
  code: string
  type: CouponType
  value: number
  min_order_amount: number
  max_usage: number
  max_usage_per_user: number
  used_count: number
  expired_at: string
  created_at: string
}

export type AvailableCouponsRequest = {
  order_amount: number
}

export type ValidateCouponRequest = {
  code: string
  order_amount: number
}

export type ApplyCouponRequest = {
  code: string
  order_amount: number
}

export type CouponValidationResult = {
  valid: boolean
  discount: number
  message?: string
}

export type CreateCouponRequest = {
  code: string
  type: CouponType
  value: number
  min_order_amount: number
  max_usage: number
  max_usage_per_user: number
  expired_at: string
}

export type UpdateCouponRequest = Partial<CreateCouponRequest>
