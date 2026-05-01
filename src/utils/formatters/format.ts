/**
 * Format số tiền theo định dạng Việt Nam
 * Ví dụ: 299000 → "299.000 ₫"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace('₫', '₫')
    .trim()
}

/**
 * Format ngày theo định dạng Việt Nam
 * Ví dụ: "2025-01-15T..." → "15/01/2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Format ngày và giờ
 * Ví dụ: "15/01/2025 14:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Format số lượng với dấu phẩy
 * Ví dụ: 1000 → "1.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

/**
 * Rút ngắn text dài
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Format phần trăm giảm giá
 * Ví dụ: 0.15 → "15%"
 */
export function formatPercent(value: number): string {
  return `${value}%`
}

/**
 * Tính phí vận chuyển
 * Theo quy tắc: subtotal >= 500000 → miễn phí, còn lại 30000đ
 */
export function calculateShippingFee(subtotal: number): number {
  return subtotal >= 500_000 ? 0 : 30_000
}
