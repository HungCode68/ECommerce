import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cartApi } from '@/api/cart.api'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { formatVND } from '@/utils/formatters/format'
import { getErrorMessage } from '@/utils/httpError'
import { getCheapestVariant, getVariantStock } from '@/utils/productVariant'
import { ROUTES } from '@/utils/constants'
import type { Product } from '@/types/product.types'
import { cn } from '@/lib/utils'

const MOCK_IMAGES = [
  "https://lh3.googleusercontent.com/aida/ADBb0ui0Sn7vY1W8msHWD6mxuGsJV_rdw0aBLFlNFjO7l8WvU19Z5yo21ihfFAz-ltxm5qASFT0wTWkGBqBKLgWMwRknnX-INlFb5Z2Ly5tdXCKHM5VKwJIphO895gCHJ_HnbfSz2hf-KwphOvUSs7AkA2cge-F5yQPTQrx53jhQDXwhFd0r4Omhd5veg_qCGWS2BkAnxfPN_HLtQZnBcoQRgkOYNwdzc5Jgdpme8THgAyyg1-6rsoFUnKe9FO71LB6CrLqHUhYIF3YPZA",
  "https://lh3.googleusercontent.com/aida/ADBb0uhvKpZavNo5vI2FYbLLpSMlFhSSGrRKg-YQdX4KmvBMW_Uq9Q5598RKA6zpK9Mqew_QnLXZwtqoqx_SZ4h6A59U8GIMkroPs41EDC4tB-2V5kxuxljuxiVpsk8fC--fh2dDqdwIqoqMKlzwblR9MKtMwkXK5kaA8jjAPNbSXZPkN936Gkx9bB8VVjezHusATfl2SiQ_q8FpUvsxum9Pm6jGm1stbXdLlH9jlpLUrqwg3u74T_IVlmoAOqDI",
  "https://lh3.googleusercontent.com/aida/ADBb0ugO3Okau-3p05aVaG-sw_Ri66p4Tkpgh4fT3YGhwWuIOAgJnxepHG5X80sPZ3ASE5VxZGULxzGQBchA1FvV3q-NTHnbmWXXlHLjImCwdbVBgsN6Rwvn7NxHEyQL_HspmvY3Hb0P0GYtZDt-jyM_7NPtCG_I6dlt0Yte7vcCeBSehmIBSpi94-Y9bYNsbBRcXxisA-qnEhhnUmOufrDyW8XkaYuXpDB7D9Qb2NAlBkmwpzzfedr6eV7xAG34AMzYMiFDjg2dJyLMWw",
  "https://lh3.googleusercontent.com/aida/ADBb0uhiVKKTNjPkWdw8naF7JVY8P5wuMfSgeVwFh5eKIxr6aKABYqCXbQ74EW1FeojYI3YWOqqGO3Jdn1gXpSZmKFPN2X1l7p8raHBqfWtRUz4p6BYVNKxp_mN4NG_Q95I5gYvCaTCrypG7PpnAPUgB1ZlK-28YX2jRXYQvBIOeVX6Mu_nQVEjHxSd3n75clxD8m85e7xZs5NwVZwFmXXKFw7R8nlQeL6MwrG1m45XptYgwHEASCd89s2bzHb72p7c-NWtyu2vXwVs9oQ",
  "https://lh3.googleusercontent.com/aida/ADBb0ui3fZ6876iCmrZyuVfJx06m1lj6o5HqqEr-9wHUnWGVyO94wk61XKoAoUbs-W-chIYjTA-B40Zh0OzIpJXVgCTxduHt2BFOLdHZkDbNyncGHN7BFAk3OKNQBSCOPvkLGgy7tuJ5B2mZ4gFxy6WmrxhxFS_gq9V7mcYsx_kXQ9LqL22ROwEFlCudRcLd-6aqY_VKImpZDCBMQg9fxYTehxwMAxlNgFAGQUq_SHt5Vot538xJ6Goa_8xhWtFSPst9zmaGxIK3s_LgzOU"
]

type ProductCardProps = {
  product: Product
  isHero?: boolean
  index?: number
}

export function ProductCard({ product, isHero = false, index = 0 }: ProductCardProps) {
  const qc = useQueryClient()
  const imageUrl = MOCK_IMAGES[index % MOCK_IMAGES.length]
  const stock = typeof product.stock === 'number' ? product.stock : undefined
  const displayPrice = product.final_price ?? product.min_price ?? 0

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: async () => {
      const detail = await productApi.getDetail(product.id)
      const variant =
        getCheapestVariant(detail.variants, { onlyInStock: true }) ??
        getCheapestVariant(detail.variants) ??
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
        <Link to={ROUTES.PRODUCT_DETAIL(product.id)} className="w-full md:w-1/2 relative bg-surface rounded-2xl p-8 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent"></div>
          <img 
            alt={product.name} 
            className="w-full h-auto object-contain z-10 transition-transform duration-700 group-hover:scale-105" 
            src={imageUrl}
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
          <Link to={ROUTES.PRODUCT_DETAIL(product.id)}>
            <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
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
      <Link to={ROUTES.PRODUCT_DETAIL(product.id)} className="w-full aspect-[4/5] relative bg-surface rounded-2xl p-6 flex items-center justify-center overflow-hidden">
        <img 
          alt={product.name} 
          className="w-full h-auto object-contain z-10 transition-transform duration-700 group-hover:scale-110" 
          src={imageUrl}
        />
        {stock === 0 && (
          <span className="absolute top-4 left-4 px-2 py-1 bg-error/10 text-error rounded-md text-[10px] font-bold tracking-wide z-20">
            HẾT HÀNG
          </span>
        )}
      </Link>
      <div className="flex flex-col flex-grow gap-2">
        <Link to={ROUTES.PRODUCT_DETAIL(product.id)}>
          <h3 className="font-headline text-lg font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
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
