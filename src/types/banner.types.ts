export type Banner = {
  id: number
  title: string
  image_url: string
  mobile_image_url?: string | null
  link_url?: string | null
  position: string
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type CreateBannerRequest = {
  title: string
  image_url: string
  mobile_image_url?: string
  link_url?: string
  position: string
  is_active?: boolean
  sort_order?: number
}

export type UpdateBannerRequest = Partial<CreateBannerRequest>

