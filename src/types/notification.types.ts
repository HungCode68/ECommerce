export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface NotificationUnreadCountResponse {
  unread_count: number
}
