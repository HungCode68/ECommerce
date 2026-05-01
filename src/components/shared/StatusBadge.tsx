import { cn } from '@/lib/utils'
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/utils/constants'
import type { OrderStatus } from '@/types/order.types'

type StatusBadgeProps = {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // ORDER_STATUS_COLOR trả về chuỗi class (VD: "bg-yellow-100 text-yellow-800")
  const colorClass = ORDER_STATUS_COLOR[status] || 'bg-slate-100 text-slate-800'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status] || status}
    </span>
  )
}
