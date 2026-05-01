import { cn } from '@/lib/utils'

type LoadingSkeletonProps = {
  className?: string
  rows?: number
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded bg-slate-200',
        'after:absolute after:inset-0 after:translate-x-[-100%]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        'after:animate-shimmer',
        className,
      )}
    />
  )
}

export function LoadingSkeleton({ className, rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={cn('h-4', i === 0 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-4 space-y-3">
          <SkeletonLine className="h-32 w-full rounded-lg" />
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <SkeletonLine className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
