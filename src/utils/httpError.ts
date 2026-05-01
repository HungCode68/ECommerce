import axios from 'axios'

type ApiErrorBody = {
  error?: string
  message?: string
}

export function getErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | string | undefined

    if (typeof data === 'string' && data.trim()) {
      return data
    }

    if (data && typeof data === 'object') {
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error
      }

      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
