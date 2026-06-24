import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'
import type {
  LoginRequest,
  LoginResponse,
  GoogleLoginRequest,
  FacebookLoginRequest,
  RegisterRequest,
  SendEmailVerificationOtpRequest,
  UpdateProfileRequest,
  User,
  VerifyEmailVerificationOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types/auth.types'

export const authApi = {
  login: async (data: LoginRequest) => {
    const res = await axiosClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      data,
    )
    return res.data.data
  },

  loginWithGoogle: async (data: GoogleLoginRequest) => {
    const res = await axiosClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/google',
      data,
    )
    return res.data.data
  },

  loginWithFacebook: async (data: FacebookLoginRequest) => {
    const res = await axiosClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/facebook',
      data,
    )
    return res.data.data
  },

  register: async (data: RegisterRequest) => {
    const res = await axiosClient.post<ApiResponse<User>>(
      '/api/auth/register',
      data,
    )
    return res.data.data
  },

  sendEmailVerificationOtp: async (data: SendEmailVerificationOtpRequest) => {
    await axiosClient.post('/api/auth/email-verification/send', data)
  },

  verifyEmailVerificationOtp: async (data: VerifyEmailVerificationOtpRequest) => {
    await axiosClient.post('/api/auth/email-verification/verify', data)
  },

  sendForgotPasswordOtp: async (data: ForgotPasswordRequest) => {
    await axiosClient.post('/api/auth/forgot-password/send-otp', data)
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    await axiosClient.post('/api/auth/forgot-password/reset', data)
  },

  logout: async () => {
    await axiosClient.post('/api/auth/logout')
  },

  refreshToken: async (refresh_token: string) => {
    const res = await axiosClient.post('/api/auth/refresh', { refresh_token })
    return res.data.data
  },

  getMe: async () => {
    const res = await axiosClient.get<ApiResponse<User>>('/api/users/me')
    return res.data.data
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const res = await axiosClient.put<ApiResponse<User>>(
      '/api/users/me',
      data,
    )
    return res.data.data
  },

  changePassword: async (data: { old_password: string; new_password: string }) => {
    await axiosClient.put('/api/users/me/password', data)
  },

  deleteAccount: async () => {
    await axiosClient.delete('/api/users/me')
  },
}
