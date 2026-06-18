import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'
import { ProductImage } from '@/components/shared/ProductImage'
import { cartApi } from '@/api/cart.api'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { ROUTES } from '@/utils/constants'
import { formatVND } from '@/utils/formatters/format'
import { getErrorMessage } from '@/utils/httpError'
import { getCheapestVariant, getVariantStock } from '@/utils/productVariant'
import type { Product } from '@/types/product.types'

type RecommendedProductsProps = {
  products: Product[]
  isLoading?: boolean
}

export function RecommendedProducts({ products, isLoading }: RecommendedProductsProps) {
  if (isLoading) {
    return (
      <section className="mt-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1c1b1b]">Bạn có thể quan tâm</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-xl border border-[#ccc3d8] bg-white" />
          ))}
        </div>
      </section>
    )
  }

  if (products.length === 0) return null

  return (
    <section className="mt-16">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1c1b1b]">Bạn có thể quan tâm</h2>
        <Link to={ROUTES.PRODUCTS} className="text-sm font-semibold text-[#630ed4] hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <RecommendedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

function RecommendedProductCard({ product }: { product: Product }) {
  const qc = useQueryClient()
  const displayPrice = product.final_price ?? product.min_price ?? 0
  const originalPrice =
    product.discount_percent > 0
      ? Math.round(displayPrice / (1 - product.discount_percent / 100))
      : product.min_price ?? displayPrice

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: async () => {
      const detail = await productApi.getDetail(product.id)
      const variant =
        getCheapestVariant(detail.variants, { onlyInStock: true }) ??
        getCheapestVariant(detail.variants) ??
        detail.variants?.[0]

      if (!variant?.id) throw new Error('Sản phẩm chưa có biến thể để thêm vào giỏ')
      if ((getVariantStock(variant) ?? 0) <= 0) throw new Error('Sản phẩm đã hết hàng')

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

  return (
    <article className="group relative rounded-xl border border-[#ccc3d8] bg-white p-3 transition-all hover:shadow-xl">
      {product.discount_percent > 0 ? (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[10px] font-semibold text-white">
          -{product.discount_percent}%
        </span>
      ) : null}

      <Link to={ROUTES.PRODUCT_DETAIL(product.slug || product.id)} className="block">
        <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-[#f6f3f2]">
          <ProductImage
            src={product.thumbnail_url}
            alt={product.name}
            className="h-full w-full"
            imgClassName="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="mb-2 min-h-[42px] line-clamp-2 text-sm font-semibold text-[#1c1b1b]">{product.name}</h3>
      </Link>

      <div className="flex flex-col gap-1">
        <span className="text-base font-bold text-[#630ed4]">{formatVND(displayPrice)}</span>
        <span className={originalPrice > displayPrice ? 'text-xs text-[#4a4455] line-through' : 'invisible text-xs'}>
          {formatVND(originalPrice)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => addToCart()}
        disabled={isPending}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#630ed4] py-2 text-sm font-semibold text-[#630ed4] transition hover:bg-[#630ed4] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShoppingCart className="h-4 w-4" />
        Thêm vào giỏ
      </button>
    </article>
  )
}
