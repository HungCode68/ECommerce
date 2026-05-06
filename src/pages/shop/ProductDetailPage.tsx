import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Star } from 'lucide-react'
import { productApi } from '@/api/product.api'
import { reviewApi } from '@/api/review.api'
import { cartApi } from '@/api/cart.api'
import { queryKeys } from '@/lib/queryKeys'
import { formatVND, formatDate } from '@/utils/formatters/format'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { getErrorMessage } from '@/utils/httpError'
import { ROUTES } from '@/utils/constants'
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
  const navigate = useNavigate()
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
    mutationFn: async (isBuyNow: boolean = false) => {
      if (hasVariants && !selectedVariantId) {
        throw new Error('Vui lòng chọn phân loại sản phẩm trước khi mua')
      }

      const defaultVariant = product?.variants?.[0]
      const selectedVariant = selectedVariantId
        ? product?.variants?.find((v) => v.id === selectedVariantId) ?? null
        : null
      const variantId = selectedVariant?.id ?? defaultVariant?.id

      if (!variantId) {
        throw new Error('Sản phẩm chưa có biến thể để mua')
      }

      await cartApi.addItem({
        product_id: productId,
        variant_id: variantId,
        quantity: qty,
      })

      return isBuyNow
    },
    onSuccess: (isBuyNow) => {
      qc.invalidateQueries({ queryKey: queryKeys.cart })
      if (isBuyNow) {
        navigate(ROUTES.CHECKOUT)
      } else {
        toast.success('Đã thêm vào giỏ hàng!')
      }
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
  const selectedVariantStock = selectedVariant ? getVariantStock(selectedVariant) : (defaultVariant ? getVariantStock(defaultVariant) : 0)
  const basePrice = product.final_price ?? product.min_price ?? 0
  const price = selectedVariant ? getVariantPrice(selectedVariant, basePrice) : basePrice
  const addToCartDisabled = adding || !hasVariants || (!!selectedVariantId && selectedVariantStock === 0)
  const addToCartLabel = !hasVariants
    ? 'Chưa có biến thể'
    : (!!selectedVariantId && selectedVariantStock === 0)
      ? 'Hết hàng'
      : 'Add to Cart'

  return (
    <div className="w-full bg-background text-on-surface font-body">
      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 xl:px-40 py-4 flex flex-wrap gap-2 items-center">
        <Link to="/" className="text-[#47919e] text-base font-medium leading-normal hover:underline">Trang Chủ</Link>
        <span className="text-[#47919e] text-base font-medium leading-normal">/</span>
        {product.category_name ? (
          <Link to={`${ROUTES.PRODUCTS}?category_id=${product.category_id}`} className="text-[#47919e] text-base font-medium leading-normal hover:underline">{product.category_name}</Link>
        ) : (
          <Link to={ROUTES.PRODUCTS} className="text-[#47919e] text-base font-medium leading-normal hover:underline">Sản Phẩm</Link>
        )}
        {product.brand && (
          <>
            <span className="text-[#47919e] text-base font-medium leading-normal">/</span>
            <Link to={ROUTES.BRANDS} className="text-[#47919e] text-base font-medium leading-normal">{product.brand}</Link>
          </>
        )}
        <span className="text-[#47919e] text-base font-medium leading-normal">/</span>
        <span className="text-[#0d1a1c] text-base font-medium leading-normal line-clamp-1">{product.name}</span>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-12 xl:px-40 py-8 space-y-16">
        {/* Gallery & Quick Info */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Gallery Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="col-span-2 rounded-xl overflow-hidden ghost-border bg-surface-container-low group">
              <img
                className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
                alt={product.name}
                src="https://lh3.googleusercontent.com/aida/ADBb0ugO3Okau-3p05aVaG-sw_Ri66p4Tkpgh4fT3YGhwWuIOAgJnxepHG5X80sPZ3ASE5VxZGULxzGQBchA1FvV3q-NTHnbmWXXlHLjImCwdbVBgsN6Rwvn7NxHEyQL_HspmvY3Hb0P0GYtZDt-jyM_7NPtCG_I6dlt0Yte7vcCeBSehmIBSpi94-Y9bYNsbBRcXxisA-qnEhhnUmOufrDyW8XkaYuXpDB7D9Qb2NAlBkmwpzzfedr6eV7xAG34AMzYMiFDjg2dJyLMWw"
              />
            </div>
            <div className="rounded-xl overflow-hidden ghost-border bg-surface-container-low group">
              <img
                className="w-full aspect-[1.68] object-cover transform transition-transform duration-500 group-hover:scale-105"
                alt="Detail view 1"
                src="https://lh3.googleusercontent.com/aida/ADBb0ujF2x_WVfaULDvVb8Pa_6AGpRnmqVgTGk9mJWW3Td-sCyKmr1jzzb2F9rSK1K6bORf_jl367NJ5txKFiwO3ONfbB3i8kk-vVZB6BU8mlyrdZAjzkPGHxX0uwZUqMbZCXrKgi0f_LzglFvGEtpEp3xtBMaWcvZ-Q85WMlMNeTq6JiGh3sVJ6xmZyyUf_d71iMlcS-cDme0goQkNH9uJsK4qfhAzeDK-hghhG-nXXz0s6Y56ZT4NJpaQwHoX2dZkgErfS40HISkvFgUk"
              />
            </div>
            <div className="rounded-xl overflow-hidden ghost-border bg-surface-container-low group">
              <img
                className="w-full aspect-[1.25] object-cover transform transition-transform duration-500 group-hover:scale-105"
                alt="Detail view 2"
                src="https://lh3.googleusercontent.com/aida/ADBb0uhvKpZavNo5vI2FYbLLpSMlFhSSGrRKg-YQdX4KmvBMW_Uq9Q5598RKA6zpK9Mqew_QnLXZwtqoqx_SZ4h6A59U8GIMkroPs41EDC4tB-2V5kxuxljuxiVpsk8fC--fh2dDqdwIqoqMKlzwblR9MKtMwkXK5kaA8jjAPNbSXZPkN936Gkx9bB8VVjezHusATfl2SiQ_q8FpUvsxum9Pm6jGm1stbXdLlH9jlpLUrqwg3u74T_IVlmoAOqDI"
              />
            </div>
          </div>

          {/* Product Purchase Details */}
          <div className="lg:col-span-5 sticky top-24 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest text-primary uppercase glass-card ghost-border">
                {product.is_published ? 'New Release' : 'Draft'}
              </span>
              <h1 className="text-4xl lg:text-6xl font-headline font-black text-on-surface tracking-tighter leading-none">{product.name}</h1>
              <p className="text-xl text-on-surface-variant font-light max-w-md">
                {product.short_description || "The pinnacle of modern technology and high-velocity design."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-label-md text-outline font-medium">Starting at</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-headline font-bold text-on-surface">{formatVND(price)}</span>
                {product.discount_percent > 0 && (
                  <span className="text-lg text-outline line-through">{formatVND(basePrice)}</span>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-4">
                <p className="text-sm font-bold text-on-surface uppercase tracking-wider">Select Variant</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariantId === v.id;
                    const isOutOfStock = getVariantStock(v) <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        disabled={isOutOfStock}
                        className={cn(
                          'rounded-xl px-5 py-3 text-sm font-medium transition-all duration-300',
                          isSelected
                            ? 'glass-card border-2 border-primary text-primary shadow-lg scale-[1.02]'
                            : 'bg-surface-container-low ghost-border text-on-surface hover:bg-surface-container hover:shadow-md',
                          isOutOfStock && 'opacity-50 cursor-not-allowed grayscale'
                        )}
                      >
                        {formatVariantLabel(v)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Qty & Actions */}
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center gap-4">
                <p className="text-sm font-bold text-on-surface uppercase tracking-wider">Quantity</p>
                <div className="flex items-center rounded-xl bg-surface-container-lowest ghost-border shadow-sm">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-on-surface-variant hover:text-primary transition-colors text-lg font-medium">-</button>
                  <span className="px-4 py-2 text-sm font-bold w-12 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="px-4 py-2 text-on-surface-variant hover:text-primary transition-colors text-lg font-medium">+</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <button
                  onClick={() => addToCart(true)}
                  disabled={addToCartDisabled}
                  className="primary-gradient text-on-primary py-5 rounded-xl font-headline font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 flex justify-center items-center gap-2"
                >
                  {adding && <Loader2 className="h-5 w-5 animate-spin" />}
                  Buy Now
                </button>
                <button
                  onClick={() => addToCart(false)}
                  disabled={addToCartDisabled}
                  className="bg-surface-container-lowest text-primary py-5 rounded-xl font-headline font-bold text-lg ghost-border transition-all hover:bg-surface-container-low disabled:opacity-60 flex justify-center items-center gap-2"
                >
                  {adding && <Loader2 className="h-5 w-5 animate-spin" />}
                  {addToCartLabel}
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="pt-8 grid grid-cols-2 gap-6 border-t border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                </div>
                <div className="text-sm">
                  <p className="font-bold">Free Shipping</p>
                  <p className="text-on-surface-variant text-xs">Standard & Express</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-xl">verified_user</span>
                </div>
                <div className="text-sm">
                  <p className="font-bold">2 Year Warranty</p>
                  <p className="text-on-surface-variant text-xs">Omni Care+ Included</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specifications Grid */}
        <section className="space-y-10 pt-8">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl font-headline font-bold text-on-surface">Clinical Specifications</h2>
              <p className="text-on-surface-variant">The architecture of intelligence and power.</p>
            </div>
            <div className="h-[1px] flex-1 mx-4 lg:mx-12 bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="p-8 rounded-xl bg-surface-container-lowest ghost-border space-y-6 hover:shadow-xl transition-all duration-300">
              <span className="material-symbols-outlined text-primary text-4xl">memory</span>
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-bold">Snapdragon 8 Gen 3</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">4nm for Galaxy, optimized for high-velocity AI processing and console-grade gaming performance.</p>
              </div>
            </div>
            <div className="p-8 rounded-xl bg-surface-container-lowest ghost-border space-y-6 hover:shadow-xl transition-all duration-300">
              <span className="material-symbols-outlined text-primary text-4xl">edgesensor_low</span>
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-bold">6.8" Pro XDR</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">2600 nits peak brightness, 120Hz LPTO dynamic refresh with advanced anti-reflective glass.</p>
              </div>
            </div>
            <div className="p-8 rounded-xl bg-surface-container-lowest ghost-border space-y-6 hover:shadow-xl transition-all duration-300">
              <span className="material-symbols-outlined text-primary text-4xl">photo_camera</span>
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-bold">200MP Master</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">Next-generation quad-telephoto system with 100x Space Zoom and AI-enhanced nightography.</p>
              </div>
            </div>
            <div className="p-8 rounded-xl bg-surface-container-lowest ghost-border space-y-6 hover:shadow-xl transition-all duration-300">
              <span className="material-symbols-outlined text-primary text-4xl">battery_charging_full</span>
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-bold">5000mAh Intelligence</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">All-day power with 45W super-fast charging and optimized power distribution through AI.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlight: Asymmetric Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center py-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-4xl lg:text-5xl font-headline font-black text-on-surface tracking-tight leading-[1.1]">
                Titanium Shell.<br /><span className="text-primary-container">Ethereal Resilience.</span>
              </h3>
              <p className="text-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {product.description || "Experience a new standard of durability with the aerospace-grade titanium frame. It's lighter, stronger, and finished with a satin-matte texture that feels like carved light in your hand."}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-4 rounded-lg bg-surface-container-high ghost-border flex flex-col gap-1">
                <span className="text-xs font-bold text-outline uppercase">Hardness</span>
                <span className="text-2xl font-headline font-bold text-primary">Level 9</span>
              </div>
              <div className="px-6 py-4 rounded-lg bg-surface-container-high ghost-border flex flex-col gap-1">
                <span className="text-xs font-bold text-outline uppercase">Weight Reduction</span>
                <span className="text-2xl font-headline font-bold text-primary">-12%</span>
              </div>
            </div>
          </div>
          <div className="relative order-first lg:order-last px-10">
            <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full"></div>
            <img
              className="relative w-full rounded-2xl shadow-2xl transform lg:rotate-3 transition-transform duration-700 hover:rotate-0"
              alt="Titanium frame"
              src="https://lh3.googleusercontent.com/aida/ADBb0ugO3Okau-3p05aVaG-sw_Ri66p4Tkpgh4fT3YGhwWuIOAgJnxepHG5X80sPZ3ASE5VxZGULxzGQBchA1FvV3q-NTHnbmWXXlHLjImCwdbVBgsN6Rwvn7NxHEyQL_HspmvY3Hb0P0GYtZDt-jyM_7NPtCG_I6dlt0Yte7vcCeBSehmIBSpi94-Y9bYNsbBRcXxisA-qnEhhnUmOufrDyW8XkaYuXpDB7D9Qb2NAlBkmwpzzfedr6eV7xAG34AMzYMiFDjg2dJyLMWw"
            />
          </div>
        </section>

        {/* Reviews & Technical Dossier integrated */}
        <section className="bg-surface-container-low rounded-[2rem] p-8 lg:p-16">
          <div className="max-w-4xl mx-auto space-y-12">

            {/* Reviews Section Styled like Dossier */}
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl lg:text-4xl font-headline font-bold">Community Verification</h2>
                <p className="text-on-surface-variant">Experiences from {reviews?.length ?? 0} verified owners.</p>
              </div>

              {/* Review form */}
              <form onSubmit={handleSubmit((d) => submitReview(d))} className="rounded-xl bg-surface-container-lowest ghost-border p-8 space-y-5 shadow-sm">
                <h3 className="font-headline font-bold text-lg text-on-surface">Submit your transmission</h3>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Rating</label>
                  <select {...register('rating')} className="rounded-lg border-0 bg-surface-container-low px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-inner">
                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Stars - {r === 5 ? 'Exceptional' : 'Average'}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <textarea
                    {...register('comment')}
                    rows={4}
                    placeholder="Document your observations..."
                    className={cn(
                      'w-full rounded-xl border-0 bg-surface-container-low px-4 py-4 text-sm resize-none focus:outline-none focus:ring-2 shadow-inner',
                      errors.comment ? 'focus:ring-red-400' : 'focus:ring-primary'
                    )}
                  />
                  {errors.comment && <p className="text-xs font-bold text-red-500">{errors.comment.message}</p>}
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={reviewing} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary hover:bg-primary-dark disabled:opacity-60 transition-all hover:shadow-lg hover:-translate-y-0.5">
                    {reviewing && <Loader2 className="h-4 w-4 animate-spin" />}
                    Transmit Data
                  </button>
                </div>
              </form>

              {/* Review list */}
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="flex flex-col gap-3 py-6 border-b border-outline-variant/30 group">
                      <div className="flex items-center justify-between">
                        <span className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{r.user_name}</span>
                        <div className="flex items-center gap-1 text-tertiary-container">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                        </div>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed">{r.comment}</p>
                      <span className="text-xs font-medium text-outline uppercase tracking-wider">{formatDate(r.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center ghost-border rounded-xl bg-surface-container-lowest/50">
                  <p className="text-outline font-medium">No transmissions recorded yet.</p>
                </div>
              )}
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}
