export type ProductVariant = {
  id: number
  product_id: number
  sku: string
  title?: string | null
  option_values?: string | null
  price_override?: number | null
  cost_price?: number | null
  stock_quantity?: number
  is_active?: boolean
  allow_backorder?: boolean
  created_at?: string
  updated_at?: string
  // Legacy aliases kept for older UI code paths while the app finishes
  // migrating to the backend field names.
  size?: string
  color?: string
  price?: number
  stock?: number
}

export type Product = {
  id: number
  name: string
  slug: string
  short_description?: string
  description: string
  brand?: string
  status: 'draft' | 'active' | 'inactive' | 'archived'
  is_published: boolean
  is_coupon_eligible: boolean
  category_id: number
  category_name?: string
  min_price: number
  discount_percent: number
  final_price: number
  stock: number
  avg_rating: number
  rating_count: number
  categories?: { id: number; name: string }[]
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
  deleted_at?: string
}

export type ProductSearchParams = {
  q?: string
  page?: number
  limit?: number
  category_id?: number
  brand?: string
  min_price?: number
  max_price?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export type CreateProductRequest = {
  name: string
  slug: string
  short_description?: string
  description: string
  brand?: string
  status?: string
  is_published?: boolean
  is_coupon_eligible?: boolean
  category_ids: number[]
  min_price: number
  discount_percent?: number
  stock?: number
}

export type UpdateProductRequest = Partial<CreateProductRequest> & {
  note?: string
}

export type CreateVariantRequest = {
  sku: string
  title?: string
  option_values: string
  price_override: number
  cost_price: number
  stock_quantity: number
  is_active: boolean
  allow_backorder: boolean
}

export type UpdateVariantRequest = Partial<CreateVariantRequest>

export type CreateVariantResponse = {
  msg: string
  variant: ProductVariant
}

export type UpdateVariantResponse = {
  msg: string
  variant: ProductVariant
}

export type DeleteVariantResponse = {
  msg: string
}

export type ProductHistory = {
  id: number
  product_id: number
  variant_id?: number | null
  admin_id?: number | null
  changed_at: string
  changes: unknown
  note?: string | null
}

export type ProductHistoryGroup = {
  message?: string
  histories: ProductHistory[]
}

export type Review = {
  id: number
  product_id: number
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export type CreateReviewRequest = {
  rating: number
  comment: string
}
