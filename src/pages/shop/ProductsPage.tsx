import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { categoryApi } from '@/api/category.api'
import { productApi } from '@/api/product.api'
import { ProductFilters } from '@/features/shop/products/ProductFilters'
import { ProductGrid } from '@/features/shop/products/ProductGrid'
import { ProductSortBar } from '@/features/shop/products/ProductSortBar'
import { Pagination } from '@/components/shared/Pagination'
import { queryKeys } from '@/lib/queryKeys'
import { ROUTES } from '@/utils/constants'
import { getVariantPrice } from '@/utils/productVariant'
import type { Product } from '@/types/product.types'

type FilterOption = {
  label: string
  value: string
}

const PAGE_SIZE = 24

function getEffectiveProductPrice(product: Product) {
  const basePrice = product.final_price ?? product.min_price ?? 0

  const variantPrices = (product.variants ?? [])
    .filter((v) => v.is_active !== false) // only active variants
    .map((variant) => getVariantPrice(variant, basePrice))
    .filter((price): price is number => typeof price === 'number' && price > 0)

  if (variantPrices.length > 0) {
    return Math.min(...variantPrices)
  }

  return basePrice > 0 ? basePrice : 0
}

function getPriceRangeValues(priceRange: string) {
  switch (priceRange) {
    case 'under_5m':
      return { min: undefined, max: 5_000_000 }
    case '5m_10m':
      return { min: 5_000_000, max: 10_000_000 }
    case '10m_20m':
      return { min: 10_000_000, max: 20_000_000 }
    case 'over_20m':
      return { min: 20_000_000, max: undefined }
    default:
      return { min: undefined, max: undefined }
  }
}

function parseVariantTokens(value?: string | null) {
  if (!value) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function extractRamValues(products: Product[]): FilterOption[] {
  const ramSet = new Set<string>()

  products.forEach((product) => {
    const candidates = [
      product.name,
      ...(product.variants ?? []).flatMap((variant) => [variant.title ?? '', variant.option_values ?? '']),
    ]

    candidates.forEach((candidate) => {
      const matches = candidate.match(/\b(4|6|8|12|16|18|24)\s?GB\b/gi)
      matches?.forEach((match) => ramSet.add(match.replace(/\s+/g, '').toUpperCase()))
    })
  })

  return Array.from(ramSet)
    .sort((a, b) => Number(a.replace('GB', '')) - Number(b.replace('GB', '')))
    .map((value) => ({ label: value, value }))
}

function extractColorValues(products: Product[]): FilterOption[] {
  const colorSet = new Set<string>()
  const dictionary = [
    'Black', 'Silver', 'White', 'Gold', 'Blue', 'Green', 'Purple', 'Violet', 'Pink', 'Gray', 'Grey',
    'Đen', 'Bạc', 'Trắng', 'Vàng', 'Xanh', 'Xanh dương', 'Xanh lá', 'Tím', 'Hồng', 'Xám',
  ]

  products.forEach((product) => {
    const candidates = [
      product.name,
      ...(product.variants ?? []).flatMap((variant) => [variant.title ?? '', variant.option_values ?? '']),
    ]

    candidates.forEach((candidate) => {
      dictionary.forEach((color) => {
        if (candidate.toLowerCase().includes(color.toLowerCase())) {
          colorSet.add(color)
        }
      })

      parseVariantTokens(candidate).forEach((token) => {
        const [label, value] = token.split(':').map((item) => item.trim())
        if (label && value && ['màu', 'màu sắc', 'color'].includes(label.toLowerCase())) {
          colorSet.add(value)
        }
      })
    })
  })

  return Array.from(colorSet).map((value) => ({ label: value, value }))
}

function matchesRam(product: Product, selectedRam: string[]) {
  if (selectedRam.length === 0) return true
  const haystack = [
    product.name,
    ...(product.variants ?? []).flatMap((variant) => [variant.title ?? '', variant.option_values ?? '']),
  ]
    .join(' ')
    .toUpperCase()

  return selectedRam.some((ram) => haystack.includes(ram.toUpperCase()))
}

function matchesColor(product: Product, selectedColors: string[]) {
  if (selectedColors.length === 0) return true
  const haystack = [
    product.name,
    ...(product.variants ?? []).flatMap((variant) => [variant.title ?? '', variant.option_values ?? '']),
  ]
    .join(' ')
    .toLowerCase()

  return selectedColors.some((color) => haystack.includes(color.toLowerCase()))
}

function sortProducts(products: Product[], sort: string) {
  const next = [...products]

  switch (sort) {
    case 'price_asc':
      return next.sort((a, b) => getEffectiveProductPrice(a) - getEffectiveProductPrice(b))
    case 'price_desc':
      return next.sort((a, b) => getEffectiveProductPrice(b) - getEffectiveProductPrice(a))
    case 'popular':
      return next.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0) || (b.avg_rating || 0) - (a.avg_rating || 0))
    default:
      return next
  }
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const page = Number(searchParams.get('page') || '1')
  const search = searchParams.get('q') || ''
  const categoryId = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined
  const selectedBrands = searchParams.getAll('brand').filter(Boolean)
  const priceRange = searchParams.get('price_range') || ''
  const selectedRam = searchParams.getAll('ram').filter(Boolean)
  const selectedColors = searchParams.getAll('color').filter(Boolean)
  const sort = searchParams.get('sort') || 'newest'
  const viewMode = searchParams.get('view') === 'list' ? 'list' : 'grid'

  const priceValues = getPriceRangeValues(priceRange)
  const usesClientSideFilters =
    selectedBrands.length > 0 || selectedRam.length > 0 || selectedColors.length > 0 || Boolean(priceRange)

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoryApi.getAll,
    staleTime: 5 * 60 * 1000,
  })

  const currentCategory = categories.find((category) => category.id === categoryId)

  const listingQuery = useQuery({
    queryKey: queryKeys.products.list({
      q: search,
      page,
      limit: PAGE_SIZE,
      category_id: categoryId,
      brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
      min_price: priceValues.min,
      max_price: priceValues.max,
      sort_by:
        sort === 'price_asc' || sort === 'price_desc'
          ? 'price'
          : sort === 'popular'
            ? 'rating'
            : 'newest',
      sort_order: sort === 'price_asc' ? 'asc' : 'desc',
    }),
    queryFn: () =>
      productApi.search({
        q: search || undefined,
        page,
        limit: PAGE_SIZE,
        category_id: categoryId,
        brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
        min_price: priceValues.min,
        max_price: priceValues.max,
        sort_by:
          sort === 'price_asc' || sort === 'price_desc'
            ? 'price'
            : sort === 'popular'
              ? 'rating'
              : 'newest',
        sort_order: sort === 'price_asc' ? 'asc' : 'desc',
      }),
  })

  const catalogQuery = useQuery({
    queryKey: queryKeys.products.list({
      source: 'catalog',
      q: search,
      category_id: categoryId,
    }),
    queryFn: () =>
      productApi.search({
        q: search || undefined,
        page: 1,
        limit: 200,
        category_id: categoryId,
      }),
    staleTime: 5 * 60 * 1000,
  })

  const catalogProducts = useMemo(() => {
    return catalogQuery.data?.data ?? []
  }, [catalogQuery.data?.data])

  const brandOptions = useMemo(() => {
    const source = catalogProducts.length > 0 ? catalogProducts : listingQuery.data?.data ?? []
    return Array.from(
      new Set(source.map((product) => product.brand).filter((brand): brand is string => Boolean(brand?.trim()))),
    ).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [catalogProducts, listingQuery.data?.data])

  const ramOptions = useMemo(() => extractRamValues(catalogProducts), [catalogProducts])
  const colorOptions = useMemo(() => extractColorValues(catalogProducts), [catalogProducts])

  const frontendFilteredProducts = useMemo(() => {
    if (!usesClientSideFilters) return []

    const base = catalogProducts.filter((product) => {
      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.includes(product.brand ?? '')
      const productPrice = getEffectiveProductPrice(product)
      const matchesPrice =
        (priceValues.min === undefined || productPrice >= priceValues.min) &&
        (priceValues.max === undefined || productPrice <= priceValues.max)

      return matchesBrand && matchesPrice && matchesRam(product, selectedRam) && matchesColor(product, selectedColors)
    })

    return sortProducts(base, sort)
  }, [catalogProducts, selectedBrands, selectedRam, selectedColors, sort, usesClientSideFilters, priceValues.max, priceValues.min])

  const displayedProducts = usesClientSideFilters
    ? frontendFilteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : listingQuery.data?.data ?? []

  const totalProducts = usesClientSideFilters
    ? frontendFilteredProducts.length
    : listingQuery.data?.pagination?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('page', '1')
      setSearchParams(nextParams, { replace: true })
    }
  }, [page, totalPages, searchParams, setSearchParams])

  const updateParams = (updater: (params: URLSearchParams) => void) => {
    const nextParams = new URLSearchParams(searchParams)
    updater(nextParams)
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handleCategoryChange = (id?: number) => {
    updateParams((params) => {
      if (id) params.set('category_id', String(id))
      else params.delete('category_id')
    })
  }

  const handleBrandToggle = (brand: string) => {
    updateParams((params) => {
      const current = params.getAll('brand')
      params.delete('brand')
      // If the clicked brand is already the only one selected, clicking it again will deselect it (since we just deleted it)
      // Otherwise, we set it as the only selected brand.
      if (!(current.length === 1 && current[0] === brand)) {
        params.set('brand', brand)
      }
    })
  }

  const handlePriceRangeChange = (value: string) => {
    updateParams((params) => {
      if (params.get('price_range') === value) params.delete('price_range')
      else params.set('price_range', value)
    })
  }

  const handleRamToggle = (value: string) => {
    updateParams((params) => {
      const current = params.getAll('ram')
      params.delete('ram')
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      next.forEach((item) => params.append('ram', item))
    })
  }

  const handleColorToggle = (value: string) => {
    updateParams((params) => {
      const current = params.getAll('color')
      params.delete('color')
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      next.forEach((item) => params.append('color', item))
    })
  }

  const handleReset = () => {
    const nextParams = new URLSearchParams()
    if (search) nextParams.set('q', search)
    setSearchParams(nextParams)
  }

  const handleSortChange = (value: string) => {
    updateParams((params) => {
      params.set('sort', value)
    })
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('view', mode)
    setSearchParams(nextParams)
  }

  const handlePageChange = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(nextPage))
    setSearchParams(nextParams)
  }

  const isLoading =
    listingQuery.isLoading ||
    (usesClientSideFilters && catalogQuery.isLoading)

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-[#4a4455]">
        <Link to={ROUTES.HOME} className="hover:text-[#630ed4]">Trang chủ</Link>
        <span>&gt;</span>
        <span className="text-[#1c1b1b]">{currentCategory?.name || 'Tất cả sản phẩm'}</span>
      </nav>

      <div className="flex gap-4">
        <ProductFilters
          categories={categories.map((category) => ({ id: category.id, name: category.name }))}
          selectedCategory={categoryId}
          onCategoryChange={handleCategoryChange}
          brands={brandOptions}
          selectedBrands={selectedBrands}
          onBrandToggle={handleBrandToggle}
          priceRange={priceRange}
          onPriceRangeChange={handlePriceRangeChange}
          ramOptions={ramOptions}
          selectedRam={selectedRam}
          onRamToggle={handleRamToggle}
          colorOptions={colorOptions}
          selectedColors={selectedColors}
          onColorToggle={handleColorToggle}
          onReset={handleReset}
          mobileOpen={mobileFiltersOpen}
          onCloseMobile={() => setMobileFiltersOpen(false)}
        />

        <section className="min-w-0 flex-1">
          <ProductSortBar
            total={totalProducts}
            sort={sort}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onOpenFilters={() => setMobileFiltersOpen(true)}
          />

          <ProductGrid
            products={displayedProducts}
            isLoading={isLoading}
            viewMode={viewMode}
          />

          <div className="mt-8 flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </section>
      </div>
    </main>
  )
}
