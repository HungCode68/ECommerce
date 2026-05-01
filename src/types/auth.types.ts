export type UserRole = 'customer' | 'admin'

export type User = {
  id: number
  username: string
  name?: string
  email: string
  phone?: string
  role: UserRole
  status: string
  created_at: string
}

export type LoginRequest = {
  identifier: string
  password: string
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
}

export type AuthTokens = {
  access_token: string
  refresh_token: string
}

export type LoginResponse = AuthTokens & {
  user: User
}

export type RefreshRequest = {
  refresh_token: string
}

export type UpdateProfileRequest = {
  username: string
  phone?: string
}
