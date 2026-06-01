import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { ProductImage } from '@/components/shared/ProductImage'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product.types'
import { ROUTES } from '@/utils/constants'
import { formatProductName, formatVND } from '@/utils/formatters/format'

type ProductListingCardProps = {
  product: Product
  viewMode?: 'grid' | 'list'
}

export function ProductListingCard({
  product,
  viewMode = 'grid',
}: ProductListingCardProps) {
  const displayPrice =
    typeof product.final_price === 'number' && product.final_price > 0
      ? product.final_price
      : product.min_price ?? 0
  const originalPrice =
    product.discount_percent > 0
      ? Math.round(displayPrice / (1 - product.discount_percent / 100))
      : 0

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.id)}
      className={cn(
        'group overflow-hidden rounded-xl border border-[#ccc3d8] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
        viewMode === 'list' && 'flex gap-4 p-4',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          viewMode === 'grid' ? 'aspect-square p-4' : 'h-36 w-36 shrink-0 rounded-lg bg-[#f6f3f2] p-3',
        )}
      >
        {product.discount_percent > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#ba1a1a] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            -{product.discount_percent}%
          </span>
        )}

        <div className={cn('flex h-full w-full items-center justify-center rounded-lg bg-[#f6f3f2]')}>
          <ProductImage
            src={product.thumbnail_url}
            alt={formatProductName(product.name)}
            imgClassName="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      <div
        className={cn(
          'space-y-2 p-4',
          viewMode === 'grid' ? '' : 'flex min-w-0 flex-1 flex-col justify-center p-0',
        )}
      >
        <h3 className="line-clamp-2 min-h-[42px] text-sm font-medium text-[#1c1b1b] transition-colors group-hover:text-[#630ed4]">
          {formatProductName(product.name)}
        </h3>

        <div className="flex items-center gap-2 text-xs text-[#7b7487]">
          {product.brand ? <span>{product.brand}</span> : null}
          {product.rating_count > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
              {product.avg_rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {viewMode === 'list' && product.short_description ? (
          <p className="line-clamp-2 text-sm text-[#4a4455]">{product.short_description}</p>
        ) : null}

        <div className="flex flex-col">
          <span className="text-lg font-bold text-[#630ed4]">{formatVND(displayPrice)}</span>
          {originalPrice > displayPrice && (
            <span className="text-xs text-[#4a4455] line-through">{formatVND(originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
