export type CallbackRequest = {
  id: number
  phone_number: string
  reason: string
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}
