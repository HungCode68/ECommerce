import { useState } from 'react'
import { cn } from '@/lib/utils'
import { optimizeCloudinaryImage } from '@/lib/images'

type ProductImageProps = {
  src?: string | null
  alt: string
  className?: string
  imgClassName?: string
  iconClassName?: string
}

export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  iconClassName,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)
  const shouldShowImage = !!src && !hasError

  if (shouldShowImage) {
    return (
      <img
        src={optimizeCloudinaryImage(src, { width: 900, height: 900 }) ?? undefined}
        alt={alt}
        className={cn('h-full w-full object-contain', imgClassName)}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50 text-slate-400',
        className,
      )}
      aria-label={`${alt} chưa có ảnh`}
    >
      <span className={cn('material-symbols-outlined text-5xl opacity-70', iconClassName)}>
        image
      </span>
      <div className="space-y-1 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
          No Image
        </p>
        <p className="text-xs text-slate-400">
          Chua co anh san pham
        </p>
      </div>
    </div>
  )
}
