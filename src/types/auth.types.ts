export type UserRole = 'customer' | 'admin'

export type User = {
  id: number
  username: string
  name?: string
  email: string
  birth_date?: string
  email_verified?: boolean
  phone?: string
  role: UserRole
  status: string
  has_password?: boolean
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
  birth_date: string
}

export type GoogleLoginRequest = {
  credential: string
}

export type FacebookLoginRequest = {
  access_token: string
}

export type SendEmailVerificationOtpRequest = {
  email: string
}

export type VerifyEmailVerificationOtpRequest = {
  email: string
  otp: string
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
  email: string
  phone?: string
  birth_date: string
}
