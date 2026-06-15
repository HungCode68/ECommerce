export type CallbackRequest = {
  id: number
  phone_number: string
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}
