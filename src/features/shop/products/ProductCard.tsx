import { Link } from 'react-router-dom'
import { Loader2, ShoppingCart } from 'lucide-react'
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

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const qc = useQueryClient()
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

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <Link to={ROUTES.PRODUCT_DETAIL(product.id)}>
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <div className="flex h-full items-center justify-center text-slate-300">
            <ShoppingCart className="h-12 w-12" />
          </div>
          {typeof stock === 'number' && stock < 5 && stock > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
              Sắp hết
            </span>
          )}
          {stock === 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
              Hết hàng
            </span>
          )}
        </div>
      </Link>

      <div className="p-3">
        <Link to={ROUTES.PRODUCT_DETAIL(product.id)}>
          <h3 className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 font-semibold text-primary">
          {formatVND(displayPrice)}
        </p>
      </div>

      <button
        onClick={() => addToCart()}
        disabled={isPending || stock === 0}
        className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2.5 text-xs font-medium text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
        {stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
      </button>
    </div>
  )
}
