import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productApi } from '@/api/product.api'
import { reviewApi } from '@/api/review.api'
import { cartApi } from '@/api/cart.api'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { ProductDescriptionTabs } from '@/features/shop/products/ProductDescriptionTabs'
import { ProductGallery } from '@/features/shop/products/ProductGallery'
import { ProductInfoPanel } from '@/features/shop/products/ProductInfoPanel'
import { RelatedProducts } from '@/features/shop/products/RelatedProducts'
import { queryKeys } from '@/lib/queryKeys'
import { getErrorMessage } from '@/utils/httpError'
import { getCheapestVariant, getVariantPrice, getVariantStock } from '@/utils/productVariant'
import { ROUTES } from '@/utils/constants'
import type { CreateReviewRequest, Product, ProductVariant } from '@/types/product.types'

type VariantAttributes = Record<string, string>
type ProductSpec = { label: string; value: string }
type GalleryItem = { image: string; label?: string }

const colorAttributeLabels = new Set(['mau', 'mau sac', 'color', 'colours', 'colours'])
const hiddenVariantGroupLabels = new Set(['kich thuoc', 'size', 'ram'])

function normalizeKey(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function parseVariantAttributes(optionValues?: string | null): VariantAttributes {
  if (!optionValues) return {}
  return optionValues
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<VariantAttributes>((acc, part) => {
      const [label, ...rest] = part.split(':')
      const key = label?.trim()
      const value = rest.join(':').trim()
      if (key && value) acc[key] = value
      return acc
    }, {})
}

function getColorValue(attributes: VariantAttributes, variant?: ProductVariant) {
  const matchedKey = Object.keys(attributes).find((key) => colorAttributeLabels.has(normalizeKey(key)))
  return attributes[matchedKey ?? ''] || variant?.color || ''
}

function buildGalleryItems(product?: Product) {
  const gallery: GalleryItem[] = []
  const seenImages = new Set<string>()
  const seenColors = new Set<string>()

  for (const variant of product?.variants ?? []) {
    const image = variant.thumbnail_url?.trim()
    if (!image) continue

    const attributes = parseVariantAttributes(variant.option_values)
    const colorValue = getColorValue(attributes, variant).trim()
    const normalizedColor = normalizeKey(colorValue)

    if (normalizedColor) {
      if (seenColors.has(normalizedColor)) continue
      seenColors.add(normalizedColor)
      gallery.push({ image, label: colorValue })
      seenImages.add(image)
      continue
    }

    if (!seenImages.has(image)) {
      gallery.push({ image, label: variant.title || product?.name })
      seenImages.add(image)
    }
  }

  if (product?.thumbnail_url && !seenImages.has(product.thumbnail_url)) {
    gallery.unshift({ image: product.thumbnail_url, label: product.name })
  }

  return gallery
}

function buildVariantGroups(variants?: ProductVariant[]) {
  const groups = new Map<string, Set<string>>()

  ;(variants ?? []).forEach((variant) => {
    const attributes = parseVariantAttributes(variant.option_values)
    Object.entries(attributes).forEach(([label, value]) => {
      if (!label || !value) return
      if (hiddenVariantGroupLabels.has(normalizeKey(label))) return
      if (!groups.has(label)) groups.set(label, new Set())
      groups.get(label)?.add(value)
    })
  })

  return Array.from(groups.entries()).map(([label, values]) => ({
    label,
    values: Array.from(values),
  }))
}

function getMatchingVariant(
  variants: ProductVariant[] | undefined,
  selectedAttributes: VariantAttributes,
) {
  return (variants ?? []).find((variant) => {
    const attributes = parseVariantAttributes(variant.option_values)
    return Object.entries(selectedAttributes).every(([label, value]) => attributes[label] === value)
  }) ?? null
}

function buildSpecs(product?: Product, activeVariant?: ProductVariant | null) {
  const variantAttributes = parseVariantAttributes(activeVariant?.option_values)
  const specs: ProductSpec[] = []
  const add = (label: string, value?: string | null) => {
    if (!value?.trim()) return
    specs.push({ label, value })
  }

  add('Thương hiệu', product?.brand)
  add('Tên sản phẩm', product?.name)
  add('Phiên bản', activeVariant?.title || variantAttributes['Phiên bản'])
  add('Dung lượng', variantAttributes['Dung lượng'])
  add('Màu sắc', variantAttributes['Màu sắc'] || variantAttributes['Màu'])
  add('Mô tả ngắn', product?.short_description)
  add('Mô tả', product?.description)

  return specs
}

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const productId = Number(id)

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<VariantAttributes>({})
  const [qty, setQty] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => productApi.getDetail(productId),
    enabled: Number.isFinite(productId),
  })

  const { data: reviews } = useQuery({
    queryKey: queryKeys.products.reviews(productId),
    queryFn: () => reviewApi.getByProduct(productId),
    enabled: Number.isFinite(productId),
  })

  const primaryCategoryId = product?.category_id ?? product?.categories?.[0]?.id
  const primaryCategoryName = product?.category_name ?? product?.categories?.[0]?.name ?? 'Sản phẩm'

  const { data: relatedProductsData, isLoading: isRelatedLoading } = useQuery({
    queryKey: queryKeys.products.list({ category_id: primaryCategoryId, limit: 8, source: 'related' }),
    queryFn: () => productApi.search({ category_id: primaryCategoryId, limit: 8 }),
    enabled: Boolean(primaryCategoryId),
  })

  const galleryItems = useMemo(() => buildGalleryItems(product), [product])
  const variantGroups = useMemo(() => buildVariantGroups(product?.variants), [product?.variants])
  const fallbackVariant = useMemo(
    () => getCheapestVariant(product?.variants, { onlyInStock: true }) ?? getCheapestVariant(product?.variants) ?? null,
    [product?.variants],
  )
  const selectedVariant = useMemo(
    () => getMatchingVariant(product?.variants, selectedAttributes) ?? fallbackVariant,
    [product?.variants, selectedAttributes, fallbackVariant],
  )

  const displayPrice = selectedVariant
    ? getVariantPrice(selectedVariant, product?.final_price ?? product?.min_price ?? 0)
    : product?.final_price ?? product?.min_price ?? 0
  const originalPrice =
    product?.discount_percent
      ? Math.round(displayPrice / (1 - product.discount_percent / 100))
      : product?.min_price ?? displayPrice

  const specs = useMemo(() => buildSpecs(product, selectedVariant), [product, selectedVariant])
  const relatedProducts = (relatedProductsData?.data ?? []).filter((item) => item.id !== productId).slice(0, 4)

  useEffect(() => {
    setSelectedImage(galleryItems[0]?.image ?? null)
    setSelectedAttributes({})
    setQty(1)
  }, [product?.id, galleryItems])

  useEffect(() => {
    const colorGroup = variantGroups.find((group) => colorAttributeLabels.has(normalizeKey(group.label)))
    if (!colorGroup) return

    const selectedColor = selectedAttributes[colorGroup.label]
    if (!selectedColor) return

    const matchedItem = galleryItems.find((item) => normalizeKey(item.label) === normalizeKey(selectedColor))
    if (matchedItem && matchedItem.image !== selectedImage) {
      setSelectedImage(matchedItem.image)
    }
  }, [galleryItems, selectedAttributes, selectedImage, variantGroups])

  const { mutate: addToCart, isPending: isAdding } = useMutation({
    mutationFn: async (buyNow: boolean) => {
      const variant = selectedVariant ?? fallbackVariant
      if (!variant?.id) {
        throw new Error('Sản phẩm chưa có biến thể để mua')
      }

      if ((getVariantStock(variant) ?? 0) <= 0) {
        throw new Error('Sản phẩm đã hết hàng')
      }

      await cartApi.addItem({
        product_id: productId,
        variant_id: variant.id,
        quantity: qty,
      })

      return buyNow
    },
    onSuccess: (buyNow) => {
      qc.invalidateQueries({ queryKey: queryKeys.cart })
      if (buyNow) {
        navigate(ROUTES.CHECKOUT)
      } else {
        toast.success('Đã thêm vào giỏ hàng!')
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Vui lòng đăng nhập để mua hàng'))
    },
  })

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: (payload: CreateReviewRequest) => reviewApi.create(productId, payload),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá sản phẩm!')
      qc.invalidateQueries({ queryKey: queryKeys.products.reviews(productId) })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Bạn cần mua sản phẩm trước khi đánh giá'))
    },
  })

  const { mutate: uploadReviewImage, isPending: isUploadingReviewImage } = useMutation({
    mutationFn: (file: File) => reviewApi.uploadImage(file),
  })

  if (!Number.isFinite(productId)) {
    return <div className="mx-auto max-w-[1200px] px-4 py-20 text-center text-[#4a4455]">ID sản phẩm không hợp lệ.</div>
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6">
        <LoadingSkeleton rows={10} />
      </div>
    )
  }

  if (!product) {
    return <div className="mx-auto max-w-[1200px] px-4 py-20 text-center text-[#4a4455]">Không tìm thấy sản phẩm.</div>
  }

  const disableActions = isAdding || (selectedVariant ? getVariantStock(selectedVariant) <= 0 : false)

  return (
    <main className="mx-auto max-w-[1200px] space-y-10 px-4 py-6 md:px-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-[#4a4455]">
        <Link to={ROUTES.HOME} className="hover:text-[#630ed4]">Trang chủ</Link>
        <span>&gt;</span>
        <Link to={`${ROUTES.PRODUCTS}?category_id=${primaryCategoryId ?? ''}`} className="hover:text-[#630ed4]">
          {primaryCategoryName}
        </Link>
        <span>&gt;</span>
        <span className="text-[#1c1b1b]">{product.name}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <ProductGallery
          name={product.name}
          items={galleryItems}
          activeImage={selectedImage}
          onImageChange={setSelectedImage}
        />

        <ProductInfoPanel
          product={product}
          rating={reviews?.avg_rating ?? product.avg_rating ?? 0}
          ratingCount={reviews?.rating_count ?? product.rating_count ?? 0}
          price={displayPrice}
          originalPrice={originalPrice}
          selectedAttributes={selectedAttributes}
          variantGroups={variantGroups}
          onSelectAttribute={(label, value) => setSelectedAttributes((current) => ({ ...current, [label]: value }))}
          qty={qty}
          onDecreaseQty={() => setQty((current) => Math.max(1, current - 1))}
          onIncreaseQty={() => setQty((current) => current + 1)}
          buyNowLabel="Thêm vào giỏ"
          onBuyNow={() => addToCart(true)}
          onAddToCart={() => addToCart(false)}
          disableBuyNow={disableActions}
          disableAddToCart={disableActions}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ProductDescriptionTabs
          description={product.description}
          specs={specs}
          reviews={reviews}
          onSubmitReview={(payload) => submitReview(payload)}
          onUploadReviewImage={(file) =>
            uploadReviewImage(file, {
              onSuccess: (url) => {
                toast.success('Đã tải ảnh lên')
                const event = new CustomEvent('product-review-image-uploaded', { detail: url })
                window.dispatchEvent(event)
              },
              onError: (error) => {
                toast.error(getErrorMessage(error, 'Tải ảnh đánh giá thất bại'))
              },
            })
          }
          reviewSubmitting={isSubmittingReview}
          reviewUploading={isUploadingReviewImage}
        />

        <div className="rounded-2xl border border-[#ccc3d8] bg-white p-5">
          <h3 className="mb-4 text-xl font-semibold text-[#1c1b1b]">Thông số nhanh</h3>
          <div className="space-y-3">
            {specs.slice(0, 5).map((spec) => (
              <div key={spec.label} className="flex items-start justify-between gap-3 border-b border-[#f0eded] pb-3 last:border-b-0 last:pb-0">
                <span className="text-sm text-[#4a4455]">{spec.label}</span>
                <span className="text-right text-sm font-medium text-[#1c1b1b]">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RelatedProducts products={relatedProducts} isLoading={isRelatedLoading} />
    </main>
  )
}
