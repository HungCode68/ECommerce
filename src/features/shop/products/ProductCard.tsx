import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cartApi } from '@/api/cart.api'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { formatProductName, formatVND } from '@/utils/formatters/format'
import { getErrorMessage } from '@/utils/httpError'
import { getCheapestVariant, getVariantStock, getVariantPrice } from '@/utils/productVariant'
import { ROUTES } from '@/utils/constants'
import type { Product } from '@/types/product.types'
import { cn } from '@/lib/utils'
import { ProductImage } from '@/components/shared/ProductImage'

type ProductCardProps = {
  product: Product
  isHero?: boolean
}

export function ProductCard({ product, isHero = false }: ProductCardProps) {
  const qc = useQueryClient()
  const stock = typeof product.stock === 'number' ? product.stock : undefined
  const basePrice = product.final_price ?? product.min_price ?? 0;
  const cheapestVariant = getCheapestVariant(product.variants, { basePrice });
  const displayPrice = cheapestVariant ? getVariantPrice(cheapestVariant, basePrice) : basePrice

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: async () => {
      const detail = await productApi.getDetail(product.id)
      const basePrice = product.final_price ?? product.min_price ?? 0;
      const variant =
        getCheapestVariant(detail.variants, { onlyInStock: true, basePrice }) ??
        getCheapestVariant(detail.variants, { basePrice }) ??
        detail.variants?.[0]

      if (!variant?.id) {
        throw new Error('Sản phẩm chưa có biến thể để thêm vào giỏ')
      }

      if ((getVariantStock(variant) ?? 0) <= 0) {
        throw new Error('Biến thể đã hết hàng')
      }

      return cartApi.addItem({
        product_id: product.id,
        variant_id: variant.id,
        quantity: 1,
      })
    },
    onSuccess: () => {
      toast.success('Đã thêm vào giỏ hàng!')
      qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Vui lòng đăng nhập để thêm vào giỏ')),
  })

  // Hero Card Layout
  if (isHero) {
    return (
      <article className="product-card col-span-1 md:col-span-2 xl:col-span-2 bg-surface-container-lowest rounded-[24px] overflow-hidden ghost-border flex flex-col md:flex-row relative group ambient-shadow p-6 gap-8">
        <Link to={ROUTES.PRODUCT_DETAIL(product.slug || product.id)} className="w-full md:w-1/2 relative bg-surface rounded-2xl p-8 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent"></div>
          <ProductImage
            src={product.thumbnail_url}
            alt={formatProductName(product.name)}
            imgClassName="z-10 h-auto transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute top-4 left-4 px-3 py-1 bg-surface-container-lowest/80 backdrop-blur-md rounded-full text-xs font-bold text-primary tracking-wide">
            FEATURED
          </span>
          {stock === 0 && (
            <span className="absolute top-4 right-4 px-3 py-1 bg-error/10 text-error rounded-full text-xs font-bold tracking-wide">
              OUT OF STOCK
            </span>
          )}
        </Link>
        <div className="w-full md:w-1/2 flex flex-col justify-center gap-4 py-4">
          <Link to={ROUTES.PRODUCT_DETAIL(product.slug || product.id)}>
            <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2">
              {formatProductName(product.name)}
            </h3>
          </Link>
          <p className="font-body text-sm text-on-surface-variant line-clamp-2">
            {product.short_description || "High-performance tech designed for the next era. Experience unmatched precision and power."}
          </p>
          <div className="mt-auto pt-6 flex items-end justify-between border-t border-surface-variant/50">
            <div className="flex flex-col">
              {product.min_price && product.min_price > displayPrice && (
                <span className="font-body text-xs text-on-surface-variant line-through">{formatVND(product.min_price)}</span>
              )}
              <span className="font-headline text-xl font-bold text-on-surface">{formatVND(displayPrice)}</span>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); addToCart(); }}
              disabled={isPending || stock === 0}
              className="w-12 h-12 rounded-xl gradient-bg text-white flex items-center justify-center hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={cn("material-symbols-outlined", isPending && "animate-spin")}>
                {isPending ? 'refresh' : 'add_shopping_cart'}
              </span>
            </button>
          </div>
        </div>
      </article>
    )
  }

  // Regular Card Layout
  return (
    <article className="product-card bg-surface-container-lowest rounded-[24px] overflow-hidden ghost-border flex flex-col relative group ambient-shadow p-5 lg:p-6 gap-4 lg:gap-6">
      <Link to={ROUTES.PRODUCT_DETAIL(product.slug || product.id)} className="w-full aspect-[4/5] relative bg-surface rounded-2xl p-6 flex items-center justify-center overflow-hidden">
        <ProductImage
          src={product.thumbnail_url}
          alt={formatProductName(product.name)}
          imgClassName="z-10 h-auto transition-transform duration-700 group-hover:scale-110"
        />
        {stock === 0 && (
          <span className="absolute top-4 left-4 px-2 py-1 bg-error/10 text-error rounded-md text-[10px] font-bold tracking-wide z-20">
            HẾT HÀNG
          </span>
        )}
      </Link>
      <div className="flex flex-col flex-grow gap-2">
        <Link to={ROUTES.PRODUCT_DETAIL(product.slug || product.id)}>
          <h3 className="font-headline text-lg font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2">
            {formatProductName(product.name)}
          </h3>
        </Link>
        <p className="font-body text-xs text-on-surface-variant line-clamp-2">
          {product.short_description || "Incredible performance packed into our most beloved lightweight design."}
        </p>
        <div className="mt-auto pt-4 lg:pt-6 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="font-headline text-base lg:text-lg font-bold text-on-surface">{formatVND(displayPrice)}</span>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); addToCart(); }}
            disabled={isPending || stock === 0}
            className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-white transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-container-high disabled:hover:text-on-surface shrink-0"
          >
            <span className={cn("material-symbols-outlined text-sm", isPending && "animate-spin")}>
              {isPending ? 'refresh' : 'add'}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}
