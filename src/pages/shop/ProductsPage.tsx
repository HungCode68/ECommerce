import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { ProductCard } from '@/features/shop/products/ProductCard'
import { ProductFilter } from '@/features/shop/products/ProductFilter'
import { SearchInput } from '@/components/shared/SearchInput'
import { Pagination } from '@/components/shared/Pagination'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePagination } from '@/hooks/usePagination'

export function ProductsPage() {
  const { page, limit, totalPages, goToPage } = usePagination({ initialLimit: 16 })
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState<number | undefined>(
    searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined
  )
  const [brand, setBrand] = useState<string | undefined>(
    searchParams.get('brand') || undefined
  )
  const [minPrice, setMinPrice] = useState<string>(
    searchParams.get('min_price') || '0'
  )
  const [maxPrice, setMaxPrice] = useState<string>(
    searchParams.get('max_price') || ''
  )
  // Sync URL changes (e.g. from navbar clicks) to local state
  useEffect(() => {
    const urlCategory = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined
    const urlSearch = searchParams.get('q') || ''
    const urlBrand = searchParams.get('brand') || undefined
    const urlMinPrice = searchParams.get('min_price') || '0'
    const urlMaxPrice = searchParams.get('max_price') || ''
    
    setCategory(urlCategory)
    setSearch(urlSearch)
    setBrand(urlBrand)
    setMinPrice(urlMinPrice)
    setMaxPrice(urlMaxPrice)
  }, [searchParams])

  const handleCategoryChange = (id?: number) => {
    setCategory(id)
    goToPage(1)
    
    const params = new URLSearchParams(searchParams)
    if (id) {
      params.set('category_id', id.toString())
    } else {
      params.delete('category_id')
    }
    setSearchParams(params)
  }

  const handleBrandChange = (b?: string) => {
    setBrand(b)
    goToPage(1)
    
    const params = new URLSearchParams(searchParams)
    if (b) {
      params.set('brand', b)
    } else {
      params.delete('brand')
    }
    setSearchParams(params)
  }

  const handleSearchChange = (v: string) => {
    setSearch(v)
    goToPage(1)
    
    const params = new URLSearchParams(searchParams)
    if (v) {
      params.set('q', v)
    } else {
      params.delete('q')
    }
    setSearchParams(params)
  }

  const handlePriceChange = (min: string, max: string) => {
    setMinPrice(min)
    setMaxPrice(max)
    goToPage(1)

    const params = new URLSearchParams(searchParams)
    if (min && min !== '0') {
      params.set('min_price', min)
    } else {
      params.delete('min_price')
    }

    if (max) {
      params.set('max_price', max)
    } else {
      params.delete('max_price')
    }
    setSearchParams(params)
  }

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.list({ 
      q: search, 
      page, 
      limit, 
      category_id: category, 
      brand,
      min_price: minPrice && minPrice !== '0' ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined
    }),
    queryFn: () =>
      productApi.search({ 
        q: search, 
        page, 
        limit, 
        category_id: category, 
        brand,
        min_price: minPrice && minPrice !== '0' ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined
      }),
  })

  const products = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const pages = totalPages(total)

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-8 lg:py-12">
      {/* Promotional Banner */}
      <section className="w-full relative rounded-[24px] overflow-hidden bg-surface-container-low min-h-[400px] flex items-center p-8 md:p-16 mb-12 ambient-shadow">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Kinetic Pro Ultra Promotion" 
            className="w-full h-full object-cover opacity-90 object-right-bottom" 
            src="https://lh3.googleusercontent.com/aida/ADBb0ujF2x_WVfaULDvVb8Pa_6AGpRnmqVgTGk9mJWW3Td-sCyKmr1jzzb2F9rSK1K6bORf_jl367NJ5txKFiwO3ONfbB3i8kk-vVZB6BU8mlyrdZAjzkPGHxX0uwZUqMbZCXrKgi0f_LzglFvGEtpEp3xtBMaWcvZ-Q85WMlMNeTq6JiGh3sVJ6xmZyyUf_d71iMlcS-cDme0goQkNH9uJsK4qfhAzeDK-hghhG-nXXz0s6Y56ZT4NJpaQwHoX2dZkgErfS40HISkvFgUk"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-xl flex flex-col gap-6">
          <span className="px-4 py-1.5 rounded-full bg-surface-container-lowest/50 backdrop-blur-md text-primary font-body text-sm font-bold tracking-widest uppercase inline-flex items-center gap-2 w-max ghost-border">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            New Release
          </span>
          <h1 className="font-headline text-display-lg md:text-6xl lg:text-7xl font-bold tracking-tight text-on-surface leading-tight">
            Kinetic Pro Ultra. <br/>
            <span className="gradient-text">Beyond Reality.</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-md leading-relaxed">
            Experience the next generation of spatial computing embedded in a sleek, titanium frame. Pre-order now and redefine your digital horizon.
          </p>
          <div className="flex gap-4 mt-4">
            <button className="gradient-bg text-white px-8 py-4 rounded-xl font-body font-bold text-label-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2">
              Pre-order Now
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button className="bg-surface-container-lowest text-primary px-8 py-4 rounded-xl font-body font-bold text-label-lg transition-transform hover:scale-105 active:scale-95 ghost-border hover:border-primary-container/40">
              Watch Keynote
            </button>
          </div>
        </div>
      </section>

      {/* Category Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Sidebar: Filters */}
        <ProductFilter
          selectedCategory={category}
          onCategoryChange={handleCategoryChange}
          selectedBrand={brand}
          onBrandChange={handleBrandChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={handlePriceChange}
        />

        {/* Main Product Grid */}
        <section className="col-span-1 lg:col-span-9 flex flex-col gap-8">
          {/* Grid Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="font-body text-on-surface-variant text-sm"><span className="font-bold text-on-surface">{total}</span> devices found</p>
            <div className="flex items-center gap-4">
              <SearchInput onSearch={handleSearchChange} placeholder="Tìm sản phẩm..." className="w-48 sm:w-64" />
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-on-surface-variant hidden sm:block">Sort by:</span>
                <select className="bg-surface-container-lowest border-none font-body text-sm font-medium text-on-surface py-2 px-4 rounded-xl ghost-border focus:ring-1 focus:ring-primary-container outline-none cursor-pointer appearance-none pr-8 relative">
                  <option>Latest Releases</option>
                  <option>Price: High to Low</option>
                  <option>Price: Low to High</option>
                  <option>Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* The Bento Grid */}
          {isLoading ? (
            <CardSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState title="Không tìm thấy sản phẩm" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((p, index) => (
                  <ProductCard key={p.id} product={p} isHero={index === 0} />
                ))}
              </div>
              
              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <Pagination page={page} totalPages={pages} onPageChange={goToPage} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
