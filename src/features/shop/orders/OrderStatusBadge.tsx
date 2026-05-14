import { cn } from '@/lib/utils'
import { getOrderStatusMeta } from './orderHelpers'

type OrderStatusBadgeProps = {
  status: string | undefined
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const meta = getOrderStatusMeta(status)
  const Icon = meta.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        meta.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  )
}
