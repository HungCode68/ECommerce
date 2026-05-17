import axios from 'axios'

const BLOCKED_ACCOUNT_MESSAGE =
  'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ khách hàng để được xử lý.'

function extractErrorText(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return ''
  }

  const message = error.response?.data?.message
  const details = error.response?.data?.errors

  if (typeof details === 'string') {
    return `${message ?? ''} ${details}`.trim()
  }

  if (details && typeof details === 'object') {
    return `${message ?? ''} ${Object.values(details).join(' ')}`.trim()
  }

  return typeof message === 'string' ? message : ''
}

export function isBlockedAccountError(error: unknown) {
  const normalized = extractErrorText(error).toLowerCase()

  return normalized.includes('đã bị khóa') || normalized.includes('tai khoan da bi khoa')
}

export function getBlockedAccountMessage() {
  return BLOCKED_ACCOUNT_MESSAGE
}
