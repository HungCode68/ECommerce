import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BadgePercent, Camera, ChevronLeft, ChevronRight, Clock3, Cpu, Loader2, PackageCheck, ReceiptText, RefreshCcw, Star, X } from 'lucide-react'
import { productApi } from '@/api/product.api'
import { reviewApi } from '@/api/review.api'
import { cartApi } from '@/api/cart.api'
import { queryKeys } from '@/lib/queryKeys'
import { formatVND } from '@/utils/formatters/format'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { ProductImage } from '@/components/shared/ProductImage'
import { getErrorMessage } from '@/utils/httpError'
import { ROUTES } from '@/utils/constants'
import { formatVariantLabel, getCheapestVariant, getVariantPrice, getVariantStock } from '@/utils/productVariant'
import type { CreateReviewRequest, ProductVariant } from '@/types/product.types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  body: z.string().min(15, 'Nhận xét tối thiểu 15 ký tự'),
  performance_rating: z.coerce.number().min(1).max(5),
  battery_rating: z.coerce.number().min(1).max(5),
  camera_rating: z.coerce.number().min(1).max(5),
})

type ReviewFormData = z.infer<typeof reviewSchema>

type VariantAttributes = Record<string, string>

type VariantOptionGroup = {
  label: string
  values: string[]
}

type ProductSpec = {
  label: string
  value: string
}

type ReviewFilter = 'all' | 'with_media' | 'verified' | 5 | 4 | 3 | 2 | 1

const COLOR_LABELS = new Set(['Màu', 'Màu sắc', 'Color'])
const SPECIFIC_COLOR_NAMES = [
  'Xanh dương',
  'Xanh lá',
  'Xanh lục',
  'Xanh ngọc',
  'Xanh navy',
  'Xanh da trời',
  'Xanh lam',
  'Xanh mint',
]

function parseVariantAttributes(optionValues?: string | null): VariantAttributes {
  if (!optionValues) {
    return {}
  }

  return optionValues
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<VariantAttributes>((acc, part) => {
      const [label, ...rest] = part.split(':')
      const key = label?.trim()
      const value = rest.join(':').trim()

      if (key && value) {
        acc[key] = value
      }

      return acc
    }, {})
}

function sortVariantGroups(groups: VariantOptionGroup[]) {
  const priority: Record<string, number> = {
    'Phiên bản': 0,
    'Dung lượng': 1,
    'RAM': 2,
    'Kích thước': 3,
    'Màu sắc': 4,
  }

  return [...groups].sort((a, b) => {
    const aPriority = priority[a.label] ?? 99
    const bPriority = priority[b.label] ?? 99
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    return a.label.localeCompare(b.label, 'vi')
  })
}

function shouldDisplayVariantGroup(label: string) {
  return !['RAM', 'Kích thước'].includes(label)
}

function inferSpecificColorFromTitle(title?: string | null) {
  const normalizedTitle = title?.toLowerCase() ?? ''
  const matchedSpecificColor = SPECIFIC_COLOR_NAMES.find((color) =>
    normalizedTitle.includes(color.toLowerCase()),
  )
  return matchedSpecificColor ?? null
}

function inferSpecificColorFromSiblingVariants(
  variant: ProductVariant,
  allVariants: ProductVariant[] | undefined,
) {
  if (!variant.thumbnail_url) {
    return null
  }

  return (
    (allVariants ?? [])
      .filter((candidate) => candidate.thumbnail_url === variant.thumbnail_url)
      .map((candidate) => inferSpecificColorFromTitle(candidate.title))
      .find(Boolean) ?? null
  )
}

function resolveVariantAttributeValue(
  variant: ProductVariant,
  allVariants: ProductVariant[] | undefined,
  label: string,
  rawValue: string | undefined,
) {
  if (!rawValue) {
    return ''
  }

  if (!COLOR_LABELS.has(label)) {
    return rawValue
  }

  const normalizedRaw = rawValue.trim().toLowerCase()
  if (normalizedRaw !== 'xanh') {
    return rawValue
  }

  const matchedSpecificColor =
    inferSpecificColorFromTitle(variant.title) ??
    inferSpecificColorFromSiblingVariants(variant, allVariants)

  return matchedSpecificColor ?? rawValue
}

function getVariantsMatchingAttributes(
  variants: ProductVariant[] | undefined,
  selectedAttributes: VariantAttributes,
  ignoredLabel?: string,
) {
  return (variants ?? []).filter((variant) => {
    const rawAttributes = parseVariantAttributes(variant.option_values)
    return Object.entries(selectedAttributes).every(([label, value]) => {
      if (ignoredLabel && label === ignoredLabel) {
        return true
      }

      const resolvedValue = resolveVariantAttributeValue(variant, variants, label, rawAttributes[label])
      return !value || resolvedValue === value
    })
  })
}

function getVariantColorValue(variant: ProductVariant) {
  const rawAttributes = parseVariantAttributes(variant.option_values)
  const colorEntry = Object.entries(rawAttributes).find(([label]) => COLOR_LABELS.has(label))

  if (!colorEntry) {
    return null
  }

  return resolveVariantAttributeValue(variant, undefined, colorEntry[0], colorEntry[1]) || null
}

function buildGalleryImages(
  productThumbnail: string | null | undefined,
  variants: ProductVariant[] | undefined,
  activeVariant: ProductVariant | null,
) {
  const sourceVariants = variants ?? []
  const images: string[] = []
  const seenColors = new Set<string>()

  if (activeVariant?.thumbnail_url) {
    images.push(activeVariant.thumbnail_url)
    const activeColor = getVariantColorValue(activeVariant)
    if (activeColor) {
      seenColors.add(activeColor)
    }
  }

  for (const variant of sourceVariants) {
    if (!variant.thumbnail_url) {
      continue
    }

    const colorValue = getVariantColorValue(variant)

    if (colorValue) {
      if (seenColors.has(colorValue)) {
        continue
      }
      seenColors.add(colorValue)
    } else if (images.includes(variant.thumbnail_url)) {
      continue
    }

    if (!images.includes(variant.thumbnail_url)) {
      images.push(variant.thumbnail_url)
    }
  }

  if (productThumbnail && !images.includes(productThumbnail)) {
    images.push(productThumbnail)
  }

  return images
}

function buildProductSpecs(
  product: {
    brand?: string
    description?: string
    short_description?: string
  },
  activeVariantAttributes: VariantAttributes,
): ProductSpec[] {
  const specs: ProductSpec[] = []
  const pushIfPresent = (label: string, value?: string | null) => {
    const normalized = value?.trim()
    if (!normalized) {
      return
    }
    specs.push({ label, value: normalized })
  }

  pushIfPresent('Thương hiệu', product.brand)
  pushIfPresent('Dung lượng', activeVariantAttributes['Dung lượng'])
  pushIfPresent('RAM', activeVariantAttributes['RAM'])
  pushIfPresent('Màu sắc', activeVariantAttributes['Màu sắc'] ?? activeVariantAttributes['Màu'])
  pushIfPresent('Phiên bản', activeVariantAttributes['Phiên bản'])
  pushIfPresent('Mô tả ngắn', product.short_description)
  pushIfPresent('Mô tả chi tiết', product.description)

  return specs
}

function formatReviewTime(dateString: string) {
  const createdAt = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const day = 24 * 60 * 60 * 1000
  const month = 30 * day

  if (diffMs < day) {
    return 'Đánh giá vừa đăng hôm nay'
  }

  if (diffMs < month) {
    const days = Math.max(1, Math.floor(diffMs / day))
    return `Đánh giá đã đăng vào ${days} ngày trước`
  }

  const months = Math.max(1, Math.floor(diffMs / month))
  return `Đánh giá đã đăng vào ${months} tháng trước`
}

function getReviewHeadline(rating: number) {
  if (rating >= 5) return 'Tuyệt vời'
  if (rating >= 4) return 'Hài lòng'
  if (rating >= 3) return 'Ổn'
  if (rating >= 2) return 'Tạm được'
  return 'Chưa tốt'
}

function extractReviewHighlights(comment: string) {
  const normalized = comment.toLowerCase()
  const tags: string[] = []

  if (normalized.includes('mạnh') || normalized.includes('hiệu năng') || normalized.includes('mượt')) {
    tags.push('Hiệu năng siêu mạnh mẽ')
  }
  if (normalized.includes('pin') || normalized.includes('trâu') || normalized.includes('lâu')) {
    tags.push('Thời lượng pin cực khủng')
  }
  if (normalized.includes('camera') || normalized.includes('ảnh') || normalized.includes('chụp')) {
    tags.push('Chất lượng camera ấn tượng')
  }
  if (normalized.includes('đẹp') || normalized.includes('thiết kế') || normalized.includes('sang')) {
    tags.push('Thiết kế đẹp, cao cấp')
  }

  return tags.slice(0, 3)
}

function getRoundedStars(score: number) {
  return Math.max(0, Math.min(5, Math.round(score)))
}

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const productId = Number(id)
  const qc = useQueryClient()
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<VariantAttributes>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [activeReviewFilter, setActiveReviewFilter] = useState<ReviewFilter>('all')
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false)
  const [reviewImageUrls, setReviewImageUrls] = useState<string[]>([])
  const [experienceRatings, setExperienceRatings] = useState({
    performance: 5,
    battery: 5,
    camera: 5,
  })

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
      if (hasVariants && !hasChosenCompleteVariant) {
        throw new Error('Vui lòng chọn phân loại sản phẩm trước khi mua')
      }

      const variantId = exactSelectedVariant?.id ?? selectedVariantId ?? fallbackVariant?.id

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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      performance_rating: 5,
      battery_rating: 5,
      camera_rating: 5,
    },
  })
  const selectedReviewRating = watch('rating')

  const { mutate: submitReview, isPending: reviewing } = useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewApi.create(productId, data),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá!')
      reset()
      setReviewImageUrls([])
      setExperienceRatings({
        performance: 5,
        battery: 5,
        camera: 5,
      })
      setIsReviewFormOpen(false)
      qc.invalidateQueries({ queryKey: queryKeys.products.reviews(productId) })
    },
    onError: () => toast.error('Bạn cần mua sản phẩm trước khi đánh giá'),
  })
  const { mutate: uploadReviewImage, isPending: uploadingReviewImage } = useMutation({
    mutationFn: (file: File) => reviewApi.uploadImage(file),
    onSuccess: (url) => {
      setReviewImageUrls((current) => (current.includes(url) ? current : [...current, url]))
      toast.success('Đã tải ảnh đánh giá lên')
    },
    onError: () => toast.error('Tải ảnh đánh giá thất bại'),
  })
  const variantGroupsMap = new Map<string, Set<string>>()
  ;(product?.variants ?? []).forEach((variant) => {
    const rawAttributes = parseVariantAttributes(variant.option_values)
    Object.entries(rawAttributes).forEach(([label, value]) => {
      if (!variantGroupsMap.has(label)) {
        variantGroupsMap.set(label, new Set())
      }
      variantGroupsMap.get(label)?.add(resolveVariantAttributeValue(variant, product?.variants, label, value))
    })
  })

  const variantOptionGroups = sortVariantGroups(
    Array.from(variantGroupsMap.entries())
      .map(([label, values]) => ({
        label,
        values: Array.from(values),
      }))
      .filter((group) => group.values.length > 0 && shouldDisplayVariantGroup(group.label)),
  )

  const hasVariants = (product?.variants?.length ?? 0) > 0
  const requiresGroupedSelection = variantOptionGroups.length > 0
  const selectedVariant = selectedVariantId
    ? product?.variants?.find((v) => v.id === selectedVariantId) ?? null
    : null
  const fallbackVariant =
    getCheapestVariant(product?.variants, { onlyInStock: true }) ??
    getCheapestVariant(product?.variants) ??
    null

  const matchedVariantsByAttributes = getVariantsMatchingAttributes(product?.variants, selectedAttributes)

  const exactSelectedVariant =
    requiresGroupedSelection &&
    variantOptionGroups.length > 0 &&
    variantOptionGroups.every((group) => selectedAttributes[group.label])
      ? matchedVariantsByAttributes[0] ?? null
      : null

  const previewVariant = exactSelectedVariant ?? matchedVariantsByAttributes[0] ?? selectedVariant ?? fallbackVariant
  const activeVariant = requiresGroupedSelection ? previewVariant : (selectedVariant ?? fallbackVariant)
  const activeVariantAttributes =
    requiresGroupedSelection && Object.keys(selectedAttributes).length > 0
      ? selectedAttributes
      : parseVariantAttributes(activeVariant?.option_values)
  const selectedVariantStock = exactSelectedVariant ? getVariantStock(exactSelectedVariant) : 0
  const basePrice = product?.final_price ?? product?.min_price ?? 0
  const price = exactSelectedVariant ? getVariantPrice(exactSelectedVariant, basePrice) : basePrice
  const hasChosenCompleteVariant = !requiresGroupedSelection || !!exactSelectedVariant
  const addToCartDisabled = adding || !hasVariants || !hasChosenCompleteVariant || selectedVariantStock === 0
  const addToCartLabel = !hasVariants
    ? 'Chưa có biến thể'
    : !hasChosenCompleteVariant
      ? 'Chọn phiên bản'
      : selectedVariantStock === 0
        ? 'Hết hàng'
        : 'Add to Cart'

  const galleryImages = buildGalleryImages(
    product?.thumbnail_url,
    product?.variants,
    activeVariant,
  )
  const commitmentItems = [
    {
      icon: PackageCheck,
      title: 'Cam kết sản phẩm',
      description: 'Mới, đầy đủ phụ kiện từ nhà sản xuất.',
    },
    {
      icon: RefreshCcw,
      title: 'Đổi trả bảo hành',
      description: '1 đổi 1 trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.',
    },
    {
      icon: Cpu,
      title: 'Bộ sản phẩm gồm',
      description: 'Máy, sách hướng dẫn, cáp sạc và phụ kiện đi kèm theo từng phiên bản.',
    },
    {
      icon: BadgePercent,
      title: 'Giá đã gồm VAT',
      description: 'Hỗ trợ xuất hóa đơn VAT và chính sách hoàn thuế cho khách đủ điều kiện.',
    },
  ]
  const productSpecs = buildProductSpecs(
    {
      brand: product?.brand,
      short_description: product?.short_description,
      description: product?.description,
    },
    activeVariantAttributes,
  )

  const mainImage = selectedImage && galleryImages.includes(selectedImage)
    ? selectedImage
    : galleryImages[0] ?? activeVariant?.thumbnail_url ?? product?.thumbnail_url ?? null
  const currentImageIndex = mainImage ? galleryImages.indexOf(mainImage) : -1
  const reviewList = reviews?.reviews ?? []
  const averageRating = reviews?.avg_rating ?? 0
  const ratingCount = reviews?.rating_count ?? reviewList.length
  const reviewCountsByStar = useMemo(() => {
    const initial = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const item of reviews?.rating_breakdown ?? []) {
      if (item.rating >= 1 && item.rating <= 5) {
        initial[item.rating as 1 | 2 | 3 | 4 | 5] = item.count
      }
    }
    return initial
  }, [reviews?.rating_breakdown])
  const filteredReviews = reviewList.filter((review) => {
    if (activeReviewFilter === 'all') return true
    if (activeReviewFilter === 'with_media') return (review.image_urls?.length ?? 0) > 0
    if (activeReviewFilter === 'verified') return !!review.verified_purchase
    return review.rating === activeReviewFilter
  })
  const experienceSummary = [
    {
      label: 'Hiệu năng',
      score: reviews?.performance_avg ?? 0,
      count: reviewList.length,
    },
    {
      label: 'Thời lượng pin',
      score: reviews?.battery_avg ?? 0,
      count: reviewList.length,
    },
    {
      label: 'Chất lượng camera',
      score: reviews?.camera_avg ?? 0,
      count: reviewList.length,
    },
  ]
  const reviewExperienceFields = [
    {
      key: 'performance' as const,
      label: 'Hiệu năng',
      helper: 'Siêu mạnh mẽ',
    },
    {
      key: 'battery' as const,
      label: 'Thời lượng pin',
      helper: 'Cực khủng',
    },
    {
      key: 'camera' as const,
      label: 'Chất lượng camera',
      helper: 'Chụp đẹp, chuyên nghiệp',
    },
  ]

  useEffect(() => {
    setSelectedAttributes({})
    setSelectedVariantId(null)
    setSelectedImage(null)
    setQty(1)
  }, [product?.id])

  useEffect(() => {
    if (!exactSelectedVariant?.id) {
      setSelectedVariantId(null)
      return
    }

    setSelectedVariantId(exactSelectedVariant.id)
  }, [exactSelectedVariant?.id])

  useEffect(() => {
    if (!selectedImage || galleryImages.includes(selectedImage)) {
      return
    }

    setSelectedImage(galleryImages[0] ?? null)
  }, [galleryImages, selectedImage])

  useEffect(() => {
    setValue('performance_rating', experienceRatings.performance)
    setValue('battery_rating', experienceRatings.battery)
    setValue('camera_rating', experienceRatings.camera)
  }, [experienceRatings, setValue])

  const selectVariantByGroupValue = (groupLabel: string, value: string) => {
    setSelectedAttributes((current) => ({
      ...current,
      [groupLabel]: value,
    }))
  }

  const showPreviousImage = () => {
    if (galleryImages.length <= 1 || currentImageIndex < 0) {
      return
    }

    const nextIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1
    setSelectedImage(galleryImages[nextIndex])
  }

  const showNextImage = () => {
    if (galleryImages.length <= 1 || currentImageIndex < 0) {
      return
    }

    const nextIndex = currentImageIndex === galleryImages.length - 1 ? 0 : currentImageIndex + 1
    setSelectedImage(galleryImages[nextIndex])
  }

  const openReviewForm = () => {
    reset({
      rating: 5,
      body: '',
      performance_rating: 5,
      battery_rating: 5,
      camera_rating: 5,
    })
    setReviewImageUrls([])
    setExperienceRatings({
      performance: 5,
      battery: 5,
      camera: 5,
    })
    setIsReviewFormOpen(true)
  }

  if (isLoading) return <div className="container mx-auto px-4 py-8"><LoadingSkeleton rows={8} /></div>
  if (!product) return <div className="container mx-auto px-4 py-20 text-center text-slate-500">Không tìm thấy sản phẩm</div>

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
          <div className="lg:col-span-7 space-y-4">
            <div className="relative rounded-3xl overflow-hidden ghost-border bg-surface-container-low group">
              <ProductImage
                src={mainImage}
                alt={product.name}
                className="min-h-[420px]"
                imgClassName="h-full min-h-[420px] w-full object-contain transform transition-transform duration-500 group-hover:scale-105"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                    aria-label="Ảnh tiếp theo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => {
                  const isActive = image === mainImage

                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={cn(
                        'w-24 shrink-0 overflow-hidden rounded-2xl border bg-white transition-all',
                        isActive
                          ? 'border-cyan-500 shadow-[0_0_0_1px_rgba(6,182,212,0.18)]'
                          : 'border-slate-200 hover:border-cyan-300',
                      )}
                    >
                      <div className="aspect-square bg-slate-50 p-2">
                        <ProductImage
                          src={image}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="h-full w-full"
                          imgClassName="h-full w-full object-contain"
                          iconClassName="text-2xl"
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
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
                <p className="text-sm font-bold text-on-surface uppercase tracking-wider">Chọn phiên bản</p>
                <div className="space-y-6">
                  {variantOptionGroups.length > 0 ? (
                    variantOptionGroups.map((group) => (
                      <div key={group.label} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-bold text-on-surface">{group.label}</p>
                          {activeVariantAttributes[group.label] && (
                            <span className="text-sm font-medium text-on-surface-variant">
                              {activeVariantAttributes[group.label]}
                            </span>
                          )}
                        </div>

                        {COLOR_LABELS.has(group.label) ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {group.values.map((value) => {
                              const compatibleVariants = getVariantsMatchingAttributes(
                                product.variants,
                                {
                                  ...selectedAttributes,
                                  [group.label]: value,
                                },
                              )
                              const fallbackGroupVariants = getVariantsMatchingAttributes(
                                product.variants,
                                selectedAttributes,
                                group.label,
                              ).filter((variant) => {
                                const rawAttributes = parseVariantAttributes(variant.option_values)
                                return resolveVariantAttributeValue(
                                  variant,
                                  product?.variants,
                                  group.label,
                                  rawAttributes[group.label],
                                ) === value
                              })
                              const displayVariant = compatibleVariants[0] ?? fallbackGroupVariants[0] ?? null
                              const isSelected = activeVariantAttributes[group.label] === value
                              const isDisabled = !displayVariant

                              return (
                                <button
                                  key={`${group.label}-${value}`}
                                  type="button"
                                  onClick={() => selectVariantByGroupValue(group.label, value)}
                                  disabled={isDisabled}
                                  className={cn(
                                    'relative flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-all',
                                    isSelected
                                      ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]'
                                      : 'border-slate-200 hover:border-red-300 hover:shadow-sm',
                                    isDisabled && 'cursor-not-allowed opacity-40 grayscale',
                                  )}
                                >
                                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-50">
                                    <ProductImage
                                      src={displayVariant?.thumbnail_url || product.thumbnail_url}
                                      alt={`${product.name} ${value}`}
                                      className="h-full w-full"
                                      imgClassName="h-full w-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-base font-bold text-slate-900">{value}</p>
                                  </div>
                                  {isSelected && (
                                    <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-xl rounded-tr-2xl bg-red-500 text-xs font-bold text-white">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {group.values.map((value) => {
                              const isAvailable = getVariantsMatchingAttributes(
                                product.variants,
                                {
                                  ...selectedAttributes,
                                  [group.label]: value,
                                },
                              ).length > 0
                              const isSelected = activeVariantAttributes[group.label] === value

                              return (
                                <button
                                  key={`${group.label}-${value}`}
                                  type="button"
                                  onClick={() => selectVariantByGroupValue(group.label, value)}
                                  disabled={!isAvailable}
                                  className={cn(
                                    'relative rounded-2xl border px-4 py-4 text-center text-base font-medium transition-all',
                                    isSelected
                                      ? 'border-red-500 bg-red-50/40 text-slate-900 shadow-[0_0_0_1px_rgba(239,68,68,0.16)]'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:text-slate-900',
                                    !isAvailable && 'cursor-not-allowed opacity-40',
                                  )}
                                >
                                  {value}
                                  {isSelected && (
                                    <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-xl rounded-tr-2xl bg-red-500 text-xs font-bold text-white">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((v) => {
                        const isSelected = activeVariant?.id === v.id
                        const isOutOfStock = getVariantStock(v) <= 0

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
                              isOutOfStock && 'opacity-50 cursor-not-allowed grayscale',
                            )}
                          >
                            {formatVariantLabel(v)}
                          </button>
                        )
                      })}
                    </div>
                  )}
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

          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-slate-900">Cam kết sản phẩm</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {commitmentItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-[28px] bg-slate-50 p-5 shadow-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-slate-900">Thông số kỹ thuật</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <ReceiptText className="h-4 w-4" />
                Xem tất cả
              </button>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
              <table className="w-full border-collapse">
                <tbody>
                  {productSpecs.map((spec) => (
                    <tr key={spec.label} className="border-b border-slate-200 last:border-b-0">
                      <td className="w-[32%] bg-slate-50 px-5 py-4 text-sm font-medium text-slate-600 align-top">
                        {spec.label}
                      </td>
                      <td className="px-5 py-4 text-sm leading-6 text-slate-800">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="bg-surface-container-low rounded-[2rem] p-8 lg:p-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">
              Đánh giá {product.name} | Chính hãng
            </h2>

            <div className="rounded-[28px] bg-white p-8 shadow-sm">
              <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_340px] lg:items-start">
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black leading-none text-slate-900">
                      {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
                    </span>
                    <span className="pb-2 text-3xl font-medium text-slate-400">/5</span>
                  </div>
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xl text-slate-700">{ratingCount} lượt đánh giá</p>
                  <button
                    type="button"
                    onClick={openReviewForm}
                    className="rounded-xl bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-700"
                  >
                    Viết đánh giá
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewCountsByStar[star as keyof typeof reviewCountsByStar]
                    const width = ratingCount > 0 ? (count / ratingCount) * 100 : 0
                    return (
                      <div key={star} className="grid grid-cols-[24px_1fr_92px] items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <span>{star}</span>
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-red-600"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span>{count} đánh giá</span>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3 border-l border-slate-200 pl-0 lg:pl-6">
                  <h3 className="text-2xl font-bold text-slate-900">Đánh giá theo trải nghiệm</h3>
                  {experienceSummary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <span className="text-xl text-slate-800">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={cn(
                                'h-4 w-4',
                                index < getRoundedStars(item.score)
                                  ? 'fill-current text-amber-400'
                                  : 'fill-transparent text-amber-300',
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xl font-semibold text-slate-900">{item.score.toFixed(1)}/5</span>
                        <span className="text-base text-slate-400">({item.count} đánh giá)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="rounded-[28px] bg-white p-8 shadow-sm space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">Lọc đánh giá theo</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'all' as const, label: 'Tất cả' },
                    { key: 'with_media' as const, label: 'Có hình ảnh', icon: Camera },
                    { key: 'verified' as const, label: 'Đã mua hàng' },
                    { key: 5 as const, label: '5 sao' },
                    { key: 4 as const, label: '4 sao' },
                    { key: 3 as const, label: '3 sao' },
                    { key: 2 as const, label: '2 sao' },
                    { key: 1 as const, label: '1 sao' },
                  ].map((filter) => {
                    const Icon = 'icon' in filter ? filter.icon : null
                    const isActive = activeReviewFilter === filter.key
                    return (
                      <button
                        key={String(filter.key)}
                        type="button"
                        onClick={() => setActiveReviewFilter(filter.key)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base transition',
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {filter.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {filteredReviews.length > 0 ? (
                <div className="space-y-8">
                  {filteredReviews.map((review, index) => {
                    const reviewBody = review.body ?? ''
                    const highlights = extractReviewHighlights(reviewBody)
                    const reviewImages = review.image_urls ?? []
                    return (
                      <div
                        key={review.id}
                        className={cn(
                          'flex gap-4',
                          index > 0 && 'border-t border-slate-200 pt-8',
                        )}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-lg font-bold text-white">
                          {review.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-2xl font-bold text-slate-900">{review.user_name || `User #${review.user_id}`}</h4>
                            <div className="flex items-center gap-1 text-amber-400">
                              {Array.from({ length: review.rating }).map((_, starIndex) => (
                                <Star key={starIndex} className="h-4 w-4 fill-current" />
                              ))}
                            </div>
                            <span className="text-base font-medium text-slate-500">{getReviewHeadline(review.rating)}</span>
                          </div>

                          {highlights.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {highlights.map((highlight) => (
                                <span key={highlight} className="rounded-xl bg-slate-100 px-3 py-2 text-base text-slate-700">
                                  {highlight}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-lg leading-7 text-slate-800">{reviewBody}</p>

                          {reviewImages.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {reviewImages.map((imageUrl, imageIndex) => (
                                <div
                                  key={`${imageUrl}-${imageIndex}`}
                                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                >
                                  <div className="h-24 w-24 bg-slate-50 p-2">
                                    <ProductImage
                                      src={imageUrl}
                                      alt={`${review.user_name} review image ${imageIndex + 1}`}
                                      className="h-full w-full"
                                      imgClassName="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-base text-slate-400">
                            <Clock3 className="h-4 w-4" />
                            <span>{formatReviewTime(review.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 py-12 text-center text-slate-500">
                  Không có đánh giá phù hợp với bộ lọc này.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {isReviewFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-3xl font-bold text-slate-900">Đánh giá & nhận xét</h3>
              <button
                type="button"
                onClick={() => setIsReviewFormOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng đánh giá"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit((d) =>
                submitReview({
                  ...d,
                  image_urls: reviewImageUrls,
                }),
              )}
              className="space-y-6 px-6 py-6"
            >
              <input type="hidden" {...register('performance_rating', { valueAsNumber: true })} />
              <input type="hidden" {...register('battery_rating', { valueAsNumber: true })} />
              <input type="hidden" {...register('camera_rating', { valueAsNumber: true })} />
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
                  <span>🎖️</span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">{product.name} | Chính hãng</p>
                </div>
              </div>

              <div className="space-y-4 border-b border-slate-200 pb-6">
                <h4 className="text-2xl font-bold text-slate-900">Đánh giá chung</h4>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { value: 1, label: 'Rất Tệ' },
                    { value: 2, label: 'Tệ' },
                    { value: 3, label: 'Bình thường' },
                    { value: 4, label: 'Tốt' },
                    { value: 5, label: 'Tuyệt vời' },
                  ].map((ratingOption) => {
                    const isActive = Number(selectedReviewRating) === ratingOption.value
                    return (
                      <button
                        key={ratingOption.value}
                        type="button"
                        onClick={() => setValue('rating', ratingOption.value, { shouldValidate: true })}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition',
                          isActive
                            ? 'border-red-500 bg-red-50'
                            : 'border-slate-200 hover:border-red-300',
                        )}
                      >
                        <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-slate-700">{ratingOption.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4 border-b border-slate-200 pb-6">
                <h4 className="text-2xl font-bold text-slate-900">Theo trải nghiệm</h4>
                <div className="space-y-4">
                  {reviewExperienceFields.map((field) => (
                    <div key={field.key} className="grid grid-cols-[160px_1fr_180px] items-center gap-4">
                      <span className="text-lg text-slate-700">{field.label}</span>
                      <div className="flex gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const isActive = index < experienceRatings[field.key]
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() =>
                                setExperienceRatings((current) => ({
                                  ...current,
                                  [field.key]: index + 1,
                                }))
                              }
                            >
                              <Star className={cn('h-5 w-5', isActive ? 'fill-current' : 'fill-transparent text-amber-300')} />
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-lg text-slate-600">{field.helper}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  {...register('body')}
                  rows={6}
                  placeholder="Xin mời chia sẻ một số cảm nhận về sản phẩm (nhập tối thiểu 15 kí tự)"
                  className={cn(
                    'w-full rounded-2xl border bg-white px-4 py-4 text-base resize-none focus:outline-none focus:ring-2',
                    errors.body
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:ring-red-100',
                  )}
                />
                {errors.body && <p className="text-sm font-semibold text-red-500">{errors.body.message}</p>}
              </div>

              <div className="space-y-4">
                <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-slate-500 transition hover:border-red-300 hover:bg-red-50/40">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? [])
                      files.slice(0, Math.max(0, 5 - reviewImageUrls.length)).forEach((file) => {
                        uploadReviewImage(file)
                      })
                      event.currentTarget.value = ''
                    }}
                  />
                  <Camera className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-base font-medium">
                    {uploadingReviewImage ? 'Đang tải ảnh...' : 'Thêm hình ảnh'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Tối đa 5 ảnh cho mỗi đánh giá</p>
                </label>

                {reviewImageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {reviewImageUrls.map((imageUrl, index) => (
                      <div key={`${imageUrl}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="h-24 w-24 bg-slate-50 p-2">
                          <ProductImage
                            src={imageUrl}
                            alt={`Review upload ${index + 1}`}
                            className="h-full w-full"
                            imgClassName="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setReviewImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white transition hover:bg-slate-900"
                          aria-label="Xóa ảnh đánh giá"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={reviewing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-xl font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {reviewing && <Loader2 className="h-5 w-5 animate-spin" />}
                GỬI ĐÁNH GIÁ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
