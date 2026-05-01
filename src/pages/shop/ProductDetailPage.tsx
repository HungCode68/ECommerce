import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, ShoppingCart, Star } from 'lucide-react'
import { productApi } from '@/api/product.api'
import { reviewApi } from '@/api/review.api'
import { cartApi } from '@/api/cart.api'
import { queryKeys } from '@/lib/queryKeys'
import { formatVND, formatDate } from '@/utils/formatters/format'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { getErrorMessage } from '@/utils/httpError'
import { formatVariantLabel, getCheapestVariant, getVariantPrice, getVariantStock } from '@/utils/productVariant'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(5, 'Nhận xét tối thiểu 5 ký tự'),
})

type ReviewFormData = z.infer<typeof reviewSchema>

export function ProductDetailPage() {
  const { id } = useParams()
  const productId = Number(id)
  const qc = useQueryClient()
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [qty, setQty] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => productApi.getDetail(productId),
    enabled: Number.isFinite(productId),
  })

  const { data: reviews } = useQuery({
    queryKey: queryKeys.products.reviews(productId),
    queryFn: () => reviewApi.getByProduct(productId),
    enabled: !!productId,
  })

  const { mutate: addToCart, isPending: adding } = useMutation({
    mutationFn: () => {
      const defaultVariant =
        getCheapestVariant(product?.variants, { onlyInStock: true }) ??
        getCheapestVariant(product?.variants) ??
        product?.variants?.[0]
      const selectedVariant = selectedVariantId
        ? product?.variants?.find((v) => v.id === selectedVariantId) ?? null
        : null
      const variantId = selectedVariant?.id ?? defaultVariant?.id
      if (!variantId) {
        throw new Error('Sản phẩm chưa có biến thể để mua')
      }

      return cartApi.addItem({
        product_id: productId,
        variant_id: variantId,
        quantity: qty,
      })
    },
    onSuccess: () => {
      toast.success('Đã thêm vào giỏ hàng!')
      qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Vui lòng đăng nhập để mua hàng')),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5 },
  })

  const { mutate: submitReview, isPending: reviewing } = useMutation({
    mutationFn: (data: ReviewFormData) => reviewApi.create(productId, data),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá!')
      reset()
      qc.invalidateQueries({ queryKey: queryKeys.products.reviews(productId) })
    },
    onError: () => toast.error('Bạn cần mua sản phẩm trước khi đánh giá'),
  })

  if (isLoading) return <div className="container mx-auto px-4 py-8"><LoadingSkeleton rows={8} /></div>
  if (!product) return <div className="container mx-auto px-4 py-20 text-center text-slate-500">Không tìm thấy sản phẩm</div>

  const defaultVariant =
    getCheapestVariant(product.variants, { onlyInStock: true }) ??
    getCheapestVariant(product.variants) ??
    null
  const selectedVariant = selectedVariantId
    ? product.variants?.find((v) => v.id === selectedVariantId) ?? null
    : null
  const hasVariants = (product.variants?.length ?? 0) > 0
  const activeVariant = selectedVariant ?? defaultVariant
  const selectedVariantStock = getVariantStock(activeVariant)
  const basePrice = product.final_price ?? product.min_price ?? 0
  const price = selectedVariant ? getVariantPrice(selectedVariant, basePrice) : basePrice
  const addToCartDisabled = adding || !hasVariants || selectedVariantStock === 0
  const addToCartLabel = !hasVariants
    ? 'Chưa có biến thể'
    : selectedVariantStock === 0
      ? 'Hết hàng'
      : 'Thêm vào giỏ hàng'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
          <ShoppingCart className="h-24 w-24" />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400">{product.category_name}</p>
            <h1 className="font-heading text-2xl font-bold text-slate-900">{product.name}</h1>
            <p className="mt-2 text-3xl font-bold text-primary">{formatVND(price)}</p>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Phân loại</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                      selectedVariantId === v.id
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-slate-200 text-slate-600 hover:border-primary/50',
                    )}
                  >
                    {formatVariantLabel(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-slate-700">Số lượng</p>
            <div className="flex items-center rounded-lg border border-slate-200">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-slate-500 hover:text-slate-900">-</button>
              <span className="px-4 py-2 text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-slate-500 hover:text-slate-900">+</button>
            </div>
          </div>

          <button
            onClick={() => addToCart()}
            disabled={addToCartDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
            {addToCartLabel}
          </button>

          <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 border-t border-slate-100 pt-8">
        <h2 className="mb-6 font-heading text-xl font-bold text-slate-900">
          Đánh giá ({reviews?.length ?? 0})
        </h2>

        {/* Review form */}
        <form onSubmit={handleSubmit((d) => submitReview(d))} className="mb-8 rounded-xl border border-slate-100 p-5 space-y-3">
          <h3 className="font-medium text-slate-800">Gửi đánh giá của bạn</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Sao:</label>
            <select {...register('rating')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} sao</option>)}
            </select>
          </div>
          <textarea
            {...register('comment')}
            rows={3}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            className={cn('w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2', errors.comment ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/20')}
          />
          {errors.comment && <p className="text-xs text-red-500">{errors.comment.message}</p>}
          <button type="submit" disabled={reviewing} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60">
            {reviewing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Gửi đánh giá
          </button>
        </form>

        {/* Review list */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{r.user_name}</p>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(r.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Chưa có đánh giá nào.</p>
        )}
      </div>
    </div>
  )
}
