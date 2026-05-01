export type Address = {
  id: number
  user_id: number
  receiver_name: string
  receiver_phone: string
  province: string
  district: string
  ward: string
  address_detail: string
  is_default: boolean
  created_at: string
}

export type CreateAddressRequest = {
  receiver_name: string
  receiver_phone: string
  province: string
  district: string
  ward: string
  address_detail: string
  is_default: boolean
}

export type UpdateAddressRequest = Partial<CreateAddressRequest>
