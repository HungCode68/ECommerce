import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatVND, formatNumber } from '@/utils/formatters/format'

type StatsCardProps = {
  title: string
  value: number
  format?: 'currency' | 'number'
  trend?: number
  icon: React.ReactNode
  iconBg?: string
}

export function StatsCard({
  title,
  value,
  format = 'number',
  trend,
  icon,
  iconBg = 'bg-blue-50',
}: StatsCardProps) {
  const displayValue =
    format === 'currency' ? formatVND(value) : formatNumber(value)
  const isPositive = (trend ?? 0) >= 0

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">
            {displayValue}
          </p>
        </div>
        <div className={cn('rounded-xl p-3', iconBg)}>{icon}</div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          )}
          <span
            className={cn(
              'font-medium',
              isPositive ? 'text-green-600' : 'text-red-500',
            )}
          >
            {isPositive ? '+' : ''}
            {trend}%
          </span>
          <span className="text-slate-400">so với tháng trước</span>
        </div>
      )}
    </div>
  )
}
