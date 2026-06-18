import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatProductName } from '@/utils/formatters/format'
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
import type { Product, ProductVariant } from '@/types/product.types'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

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

  try {
    const parsed = JSON.parse(optionValues)
    if (typeof parsed === 'object' && parsed !== null) {
      const result: VariantAttributes = {}

      if (Array.isArray(parsed)) {
        // Handle array format: [{"label": "Màu sắc", "value": "Hồng"}, {"label": "RAM", "value": "8GB"}]
        for (const item of parsed) {
          if (item && typeof item === 'object') {
            const key = item.label || item.name || item.key
            const val = item.value || item.val
            if (key && val) {
              result[String(key).trim()] = String(val).trim()
            }
          }
        }
      } else {
        // Handle object format: {"Màu sắc": "Hồng", "RAM": "8GB"}
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined && v !== null) {
            result[k.trim()] = String(v).trim()
          }
        }
      }

      if (Object.keys(result).length > 0) return result
    }
  } catch (e) {
    // Fallback to legacy string parsing
  }

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
  let unmatchedColorLabel: string | null = null

  for (const variant of product?.variants ?? []) {
    const attributes = parseVariantAttributes(variant.option_values)
    const colorValue = getColorValue(attributes, variant).trim()
    const normalizedColor = normalizeKey(colorValue)
    const image = variant.thumbnail_url?.trim()

    if (normalizedColor) {
      if (seenColors.has(normalizedColor)) continue
      seenColors.add(normalizedColor)

      if (image) {
        gallery.push({ image, label: colorValue })
        seenImages.add(image)
      } else {
        // Variant has color but no thumbnail — remember it for the product thumbnail
        if (!unmatchedColorLabel) unmatchedColorLabel = colorValue
      }
      continue
    }

    if (image && !seenImages.has(image)) {
      gallery.push({ image, label: variant.title || product?.name })
      seenImages.add(image)
    }
  }

  if (product?.thumbnail_url && !seenImages.has(product.thumbnail_url)) {
    // If a color variant had no thumbnail, label the product image with that color
    gallery.unshift({ image: product.thumbnail_url, label: unmatchedColorLabel || product.name })
    seenImages.add(product.thumbnail_url)
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
  if (!variants || Object.keys(selectedAttributes).length === 0) return null

  // Find exact match first
  const exact = variants.find((variant) => {
    const attributes = parseVariantAttributes(variant.option_values)
    return Object.entries(selectedAttributes).every(([label, value]) => attributes[label] === value)
  })
  if (exact) return exact

  // Find best partial match (most attributes matched)
  let bestMatch: ProductVariant | null = null
  let bestScore = 0
  for (const variant of variants) {
    const attributes = parseVariantAttributes(variant.option_values)
    const score = Object.entries(selectedAttributes).filter(([label, value]) => attributes[label] === value).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = variant
    }
  }
  return bestMatch
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
  const { setCart, setBuyNow } = useCartStore()
  const slugOrId = id as string

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<VariantAttributes>({})
  const [qty, setQty] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.products.detail(slugOrId),
    queryFn: () => productApi.getDetail(slugOrId),
    enabled: !!slugOrId,
  })

  const { data: reviews } = useQuery({
    queryKey: queryKeys.products.reviews(product?.id as number),
    queryFn: () => reviewApi.getByProduct(product?.id as number),
    enabled: !!product?.id,
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
    () => getCheapestVariant(product?.variants, { onlyInStock: true, basePrice: product?.final_price ?? product?.min_price ?? 0 }) ??
          getCheapestVariant(product?.variants, { basePrice: product?.final_price ?? product?.min_price ?? 0 }) ??
          null,
    [product?.variants, product?.final_price, product?.min_price]
  );
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
  const relatedProducts = (relatedProductsData?.data ?? []).filter((item) => item.id !== product?.id).slice(0, 4)

  const handleGalleryItemSelect = (item: GalleryItem) => {
    setSelectedImage(item.image)

    const colorGroup = variantGroups.find((group) => colorAttributeLabels.has(normalizeKey(group.label)))
    if (!colorGroup || !item.label) return

    const normalizedLabel = normalizeKey(item.label)
    // Try exact match first, then fuzzy (label contains the color name)
    const matchedColor =
      colorGroup.values.find((value) => normalizeKey(value) === normalizedLabel) ??
      colorGroup.values.find((value) => normalizedLabel.includes(normalizeKey(value)))

    if (!matchedColor) return

    // Preserve non-color attributes (e.g. Dung lượng) when switching colors via gallery
    setSelectedAttributes((current) => ({
      ...current,
      [colorGroup.label]: matchedColor,
    }))
  }

  const handleSelectAttribute = (label: string, value: string) => {
    setSelectedAttributes((current) => ({
      ...current,
      [label]: value,
    }))
  }

  const isOptionAvailable = (label: string, value: string) => {
    if (!product?.variants) return true

    // If we select this value, what would the attributes look like?
    const testAttributes = { ...selectedAttributes, [label]: value }

    // Check if any variant satisfies all the test attributes
    return product.variants.some((variant) => {
      const attrs = parseVariantAttributes(variant.option_values)
      return Object.entries(testAttributes).every(([k, v]) => attrs[k] === v)
    })
  }

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

    const normalizedColor = normalizeKey(selectedColor)
    // Try exact match first, then fuzzy (gallery label contains the color name)
    const matchedItem =
      galleryItems.find((item) => normalizeKey(item.label) === normalizedColor) ??
      galleryItems.find((item) => normalizeKey(item.label ?? '').includes(normalizedColor))

    if (matchedItem && matchedItem.image !== selectedImage) {
      setSelectedImage(matchedItem.image)
      return
    }

    // Last resort: find a variant with this color and use its thumbnail or the product thumbnail
    if (!matchedItem && product) {
      const colorVariant = (product.variants ?? []).find((v) => {
        const attrs = parseVariantAttributes(v.option_values)
        return normalizeKey(getColorValue(attrs, v)) === normalizedColor
      })
      const fallbackImage = colorVariant?.thumbnail_url?.trim() || product.thumbnail_url
      if (fallbackImage && fallbackImage !== selectedImage) {
        setSelectedImage(fallbackImage)
      }
    }
  }, [galleryItems, selectedAttributes, selectedImage, variantGroups, product])

  const handleBuyNow = () => {
    if (!useAuthStore.getState().isAuthenticated) {
      toast.error('Bạn cần đăng nhập trước khi mua hàng!')
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { state: { from: window.location.pathname } })
      }, 1500)
      return
    }

    const variant = selectedVariant ?? fallbackVariant
    if (!variant?.id) {
      toast.error('Sản phẩm chưa có biến thể để mua')
      return
    }
    const stock = getVariantStock(variant) ?? 0
    const isPreorder = stock <= 0
    
    if (isPreorder) {
      toast.success('Sản phẩm tạm hết hàng. Bạn đang tiến hành đặt trước!')
    }

    setBuyNow({
      product_id: product?.id as number,
      variant_id: variant.id,
      quantity: qty,
      price: displayPrice,
      product_name: product?.name ?? '',
      variant_name: variant.title?.trim() ?? '',
      thumbnail_url: variant.thumbnail_url ?? product?.thumbnail_url ?? '',
      stock_quantity: stock,
      is_preorder: isPreorder,
    })
    navigate(ROUTES.CHECKOUT)
  }

  const { mutate: addToCart, isPending: isAdding } = useMutation({
    mutationFn: async () => {
      const variant = selectedVariant ?? fallbackVariant
      if (!variant?.id) {
        throw new Error('Sản phẩm chưa có biến thể để mua')
      }

      if ((getVariantStock(variant) ?? 0) <= 0) {
        throw new Error('Sản phẩm đã hết hàng')
      }

      await cartApi.addItem({
        product_id: product?.id as number,
        variant_id: variant.id,
        quantity: qty,
      })

      const cart = await cartApi.getCart()
      return cart
    },
    onSuccess: (cart) => {
      setCart(cart?.items ?? [])
      qc.invalidateQueries({ queryKey: queryKeys.cart })
      const addedItemName = selectedVariant?.title?.trim() || fallbackVariant?.title?.trim() || product?.name || 'sản phẩm'
      toast.success(`Đã thêm ${addedItemName} vào giỏ hàng!`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Vui lòng đăng nhập để mua hàng'))
    },
  })

  if (!slugOrId) {
    return <div className="mx-auto max-w-[1200px] px-4 py-20 text-center text-[#4a4455]">ID hoặc Slug sản phẩm không hợp lệ.</div>
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

  const currentVariant = selectedVariant ?? fallbackVariant;
  const disableAddToCart = isAdding || (currentVariant ? getVariantStock(currentVariant) <= 0 : true);
  const disableBuyNow = isAdding;

  return (
    <main className="mx-auto max-w-[1200px] space-y-10 px-4 py-6 md:px-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-[#4a4455]">
        <Link to={ROUTES.HOME} className="hover:text-[#630ed4]">Trang chủ</Link>
        <span>&gt;</span>
        <Link to={`${ROUTES.PRODUCTS}?category_id=${primaryCategoryId ?? ''}`} className="hover:text-[#630ed4]">
          {primaryCategoryName}
        </Link>
        <span>&gt;</span>
        <span className="text-[#1c1b1b]">{formatProductName(product.name)}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <ProductGallery
          name={formatProductName(product.name)}
          items={galleryItems}
          activeImage={selectedImage}
          onImageChange={handleGalleryItemSelect}
        />

        <ProductInfoPanel
          product={product}
          productTitle={formatProductName(product.name)}
          rating={reviews?.avg_rating ?? product.avg_rating ?? 0}
          ratingCount={reviews?.rating_count ?? product.rating_count ?? 0}
          price={displayPrice}
          originalPrice={originalPrice}
          variantStock={currentVariant ? getVariantStock(currentVariant) : null}
          selectedAttributes={selectedAttributes}
          variantGroups={variantGroups}
          onSelectAttribute={handleSelectAttribute}
          isOptionAvailable={isOptionAvailable}
          qty={qty}
          onChangeQty={setQty}
          onDecreaseQty={() => setQty((current) => Math.max(1, current - 1))}
          onIncreaseQty={() => setQty((current) => current + 1)}
          onBuyNow={handleBuyNow}
          onAddToCart={() => addToCart()}
          disableBuyNow={disableBuyNow}
          disableAddToCart={disableAddToCart}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ProductDescriptionTabs
          description={product.description}
          specs={specs}
          reviews={reviews}
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
