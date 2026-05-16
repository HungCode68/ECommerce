import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/utils/constants'
import { useAuthStore } from '@/store/authStore'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

// ─── Refresh Queue (tránh double refresh) ────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response Interceptor ─────────────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const url = originalRequest?.url ?? ''

    // Chỉ xử lý 401 và chưa retry
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    console.warn('[AUTH_DEBUG] 401 intercepted', {
      url,
      method: originalRequest?.method,
      responseData: error.response?.data,
    })

    // Không logout khi request đăng nhập / đăng nhập Google bị 401.
    // Các màn hình auth sẽ tự xử lý lỗi và hiển thị message phù hợp.
    if (url.includes('/auth/login') || url.includes('/auth/google')) {
      console.warn('[AUTH_DEBUG] auth endpoint 401, skip logout', { url })
      return Promise.reject(error)
    }

    if (url.includes('/auth/refresh')) {
      console.warn('[AUTH_DEBUG] logout due to refresh endpoint 401', { url })
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Đợi vào queue
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(axiosClient(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      console.warn('[AUTH_DEBUG] logout due to missing refresh token', { url })
      useAuthStore.getState().logout()
      processQueue(error, null)
      isRefreshing = false
      return Promise.reject(error)
    }

    try {
      console.log('[AUTH_DEBUG] attempting refresh token', { url })
      const { data } = await axios.post(`${(API_BASE_URL as string) === '/' ? '' : API_BASE_URL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      })
      const newAccessToken: string = data.data.access_token
      const newRefreshToken: string = data.data.refresh_token

      localStorage.setItem('refresh_token', newRefreshToken)
      useAuthStore.getState().setAccessToken(newAccessToken)
      processQueue(null, newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return axiosClient(originalRequest)
    } catch (refreshError) {
      console.warn('[AUTH_DEBUG] refresh failed, logout', { url, refreshError })
      processQueue(refreshError, null)
      useAuthStore.getState().logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosClient
