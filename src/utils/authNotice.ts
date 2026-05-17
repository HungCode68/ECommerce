const AUTH_NOTICE_KEY = 'auth_notice'

export function storeAuthNotice(message: string) {
  sessionStorage.setItem(AUTH_NOTICE_KEY, message)
}

export function consumeAuthNotice() {
  const message = sessionStorage.getItem(AUTH_NOTICE_KEY)
  if (message) {
    sessionStorage.removeItem(AUTH_NOTICE_KEY)
  }
  return message
}
