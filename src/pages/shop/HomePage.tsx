import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { bannerApi } from '@/api/banner.api'
import { categoryApi, type Category } from '@/api/category.api'
import { ProductImage } from '@/components/shared/ProductImage'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'
import type { Banner } from '@/types/banner.types'
import type { Product } from '@/types/product.types'
import { ROUTES } from '@/utils/constants'
import { formatProductName, formatVND } from '@/utils/formatters/format'

function getCategoryIcon(name: string) {
  const normalized = name.toLowerCase()

  if (normalized.includes('điện thoại') || normalized.includes('phone')) return 'smartphone'
  if (normalized.includes('laptop') || normalized.includes('macbook') || normalized.includes('máy tính')) return 'laptop_mac'
  if (normalized.includes('tai nghe') || normalized.includes('audio') || normalized.includes('loa')) return 'headphones'
  if (normalized.includes('đồng hồ') || normalized.includes('watch')) return 'watch'
  if (normalized.includes('phụ kiện') || normalized.includes('accessory')) return 'cable'
  if (normalized.includes('máy tính bảng') || normalized.includes('tablet') || normalized.includes('ipad')) return 'tablet_mac'

  return 'devices'
}

function getCategoryAnchor(category: Category) {
  return category.slug || `category-${category.id}`
}

function sortCategories(categories: Category[]) {
  return categories
    .filter((category) => category.is_active !== false)
    .sort((a, b) => {
      const countA = a.product_count ?? 0
      const countB = b.product_count ?? 0
      if (countA !== countB) return countB - countA
      return a.name.localeCompare(b.name, 'vi')
    })
}

function slugifyVietnamese(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildFallbackCategories(products: Product[]): Category[] {
  const mapped = new Map<number, Category>()

  products.forEach((product) => {
    if (!product.category_id || mapped.has(product.category_id)) return

    const name = product.category_name?.trim() || `Danh mục ${product.category_id}`
    mapped.set(product.category_id, {
      id: product.category_id,
      name,
      slug: slugifyVietnamese(name),
      is_active: true,
    })
  })

  return Array.from(mapped.values())
}

function pickHeroProduct(products: Product[]) {
  return [...products].sort((a, b) => {
    const imageScoreA = a.thumbnail_url ? 1 : 0
    const imageScoreB = b.thumbnail_url ? 1 : 0
    if (imageScoreA !== imageScoreB) {
      return imageScoreB - imageScoreA
    }

    if (a.discount_percent !== b.discount_percent) {
      return b.discount_percent - a.discount_percent
    }

    return (b.final_price ?? b.min_price ?? 0) - (a.final_price ?? a.min_price ?? 0)
  })[0]
}

function prioritizeProducts(products: Product[]) {
  return [...products].sort((a, b) => {
    const imageScoreA = a.thumbnail_url ? 1 : 0
    const imageScoreB = b.thumbnail_url ? 1 : 0
    if (imageScoreA !== imageScoreB) {
      return imageScoreB - imageScoreA
    }

    const discountDelta = (b.discount_percent ?? 0) - (a.discount_percent ?? 0)
    if (discountDelta !== 0) {
      return discountDelta
    }

    return (b.final_price ?? b.min_price ?? 0) - (a.final_price ?? a.min_price ?? 0)
  })
}

function getSectionTitle(categoryName: string) {
  const normalized = categoryName.toLowerCase()
  if (normalized.includes('điện thoại') || normalized.includes('phone')) return 'Điện thoại bán chạy'
  if (normalized.includes('laptop') || normalized.includes('macbook') || normalized.includes('máy tính')) return 'Laptop bán chạy'
  if (normalized.includes('tai nghe') || normalized.includes('audio') || normalized.includes('loa')) return 'Âm thanh & Tai nghe'
  if (normalized.includes('đồng hồ') || normalized.includes('watch')) return 'Đồng hồ thông minh'
  if (normalized.includes('phụ kiện') || normalized.includes('accessory')) return 'Phụ kiện nổi bật'
  return categoryName
}

function getViewAllLabel(categoryName: string) {
  const normalized = categoryName.toLowerCase()
  if (normalized.includes('điện thoại') || normalized.includes('phone')) return 'Tất cả điện thoại'
  if (normalized.includes('laptop') || normalized.includes('macbook') || normalized.includes('máy tính')) return 'Tất cả laptop'
  if (normalized.includes('tai nghe') || normalized.includes('audio') || normalized.includes('loa')) return 'Xem tất cả'
  return `Xem tất cả`
}

function HomeProductCard({
  product,
  emphasized = false,
}: {
  product: Product
  emphasized?: boolean
}) {
  const originalPrice =
    product.discount_percent > 0
      ? Math.round(product.final_price / (1 - product.discount_percent / 100))
      : 0

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.id)}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#e5e2e1] bg-white p-3 transition-shadow hover:shadow-lg',
        emphasized && 'md:col-span-2',
      )}
    >
      {product.discount_percent > 0 && (
        <div className="absolute left-2 top-2 z-10 rounded-full bg-[#ba1a1a] px-2 py-0.5 text-xs font-bold text-white">
          -{product.discount_percent}%
        </div>
      )}

      <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-[#f6f3f2]">
        <ProductImage
          src={product.thumbnail_url}
          alt={formatProductName(product.name)}
          className="h-full w-full"
          imgClassName="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          iconClassName="text-4xl"
        />
      </div>

      <h3 className="mb-2 line-clamp-2 min-h-[42px] text-sm font-medium text-[#1c1b1b]">
        {formatProductName(product.name)}
      </h3>

      <div className="mt-auto">
        <p className="text-base font-bold text-[#630ed4]">{formatVND(product.final_price)}</p>
        {originalPrice > product.final_price && (
          <p className="text-xs text-[#4a4455] line-through">{formatVND(originalPrice)}</p>
        )}
      </div>
    </Link>
  )
}

function CategorySectionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-[#e5e2e1] bg-white p-3">
          <div className="mb-3 h-40 rounded-lg bg-slate-200" />
          <LoadingSkeleton rows={3} />
        </div>
      ))}
    </div>
  )
}

function BannerAnchor({
  banner,
  className,
  children,
}: {
  banner: Banner
  className?: string
  children: React.ReactNode
}) {
  const href = banner.link_url?.trim()

  if (!href) {
    return <div className={className}>{children}</div>
  }

  if (href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

function HomeEdgeBanner({ banner, side }: { banner: Banner; side: 'left' | 'right' }) {
  return (
    <BannerAnchor
      banner={banner}
      className={cn(
        'group block h-[490px] w-[168px] overflow-hidden rounded-[22px] border border-[#e5e2e1] bg-white shadow-[0_18px_40px_rgba(30,27,75,0.12)] transition-transform duration-300 hover:-translate-y-1',
        side === 'left' ? 'origin-right' : 'origin-left',
      )}
    >
      <div className="relative h-full w-full overflow-hidden">
        <img
          src={banner.image_url}
          alt={banner.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </BannerAnchor>
  )
}

export function HomePage() {
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoryApi.getAll,
    staleTime: 5 * 60 * 1000,
  })

  const { data: featuredProductsData, isLoading: isFeaturedProductsLoading } = useQuery({
    queryKey: queryKeys.products.list({ limit: 12 }),
    queryFn: () => productApi.search({ limit: 12 }),
  })
  const { data: homeLeftEdgeBannersData } = useQuery({
    queryKey: queryKeys.banners.list('home_edge_left'),
    queryFn: () => bannerApi.getActive('home_edge_left'),
    staleTime: 5 * 60 * 1000,
  })
  const { data: homeRightEdgeBannersData } = useQuery({
    queryKey: queryKeys.banners.list('home_edge_right'),
    queryFn: () => bannerApi.getActive('home_edge_right'),
    staleTime: 5 * 60 * 1000,
  })

  const featuredProducts = featuredProductsData?.data ?? []
  const sortedCategories = sortCategories(categories)
  const fallbackCategories = buildFallbackCategories(featuredProducts)
  const effectiveCategories = sortedCategories.length > 0 ? sortedCategories : fallbackCategories
  const quickNavCategories = effectiveCategories.slice(0, 5)
  const showcaseCategories = quickNavCategories.slice(0, 3)
  const accessoryCategory = quickNavCategories[4] ?? quickNavCategories[3] ?? quickNavCategories[0]

  const categoryProductQueries = useQueries({
    queries: showcaseCategories.map((category) => ({
      queryKey: queryKeys.products.list({ category_id: category.id, limit: 5 }),
      queryFn: () => productApi.search({ category_id: category.id, limit: 5 }),
      enabled: category.id > 0,
    })),
  })

  const accessoryProductsQuery = useQuery({
    queryKey: queryKeys.products.list({ category_id: accessoryCategory?.id, limit: 4 }),
    queryFn: () => productApi.search({ category_id: accessoryCategory!.id, limit: 4 }),
    enabled: Boolean(accessoryCategory?.id),
  })

  const prioritizedFeaturedProducts = prioritizeProducts(featuredProducts)
  const heroProduct = pickHeroProduct(prioritizedFeaturedProducts) ?? prioritizedFeaturedProducts[0]
  const promoProducts = prioritizeProducts(
    prioritizedFeaturedProducts.filter((product) => product.id !== heroProduct?.id),
  ).slice(0, 2)
  const accessoryProduct = prioritizeProducts(accessoryProductsQuery.data?.data ?? [])[0]
  const featuredFallbackProducts = prioritizedFeaturedProducts.slice(0, 5)
  const homeLeftEdgeBanners = Array.isArray(homeLeftEdgeBannersData) ? homeLeftEdgeBannersData : []
  const homeRightEdgeBanners = Array.isArray(homeRightEdgeBannersData) ? homeRightEdgeBannersData : []
  const leftEdgeBanner = homeLeftEdgeBanners[0]
  const rightEdgeBanner = homeRightEdgeBanners[0]

  return (
    <div className="bg-[#fcf9f8] pb-16 text-[#1c1b1b]">
      <div className="relative mx-auto w-full max-w-[1200px]">
        {leftEdgeBanner && (
          <div className="absolute bottom-0 right-[calc(100%+16px)] top-0 z-10 hidden min-[1520px]:block">
            <div className="sticky top-[230px]">
              <HomeEdgeBanner banner={leftEdgeBanner} side="left" />
            </div>
          </div>
        )}
        {rightEdgeBanner && (
          <div className="absolute bottom-0 left-[calc(100%+16px)] top-0 z-10 hidden min-[1520px]:block">
            <div className="sticky top-[230px]">
              <HomeEdgeBanner banner={rightEdgeBanner} side="right" />
            </div>
          </div>
        )}

        <main className="flex w-full flex-col gap-6 px-4 py-6 md:px-6">
        <section className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-5">
            {heroProduct ? (
              <div className="flex min-h-[400px] flex-col justify-center rounded-xl bg-gradient-to-br from-[#630ed4] to-[#674bb5] p-8 text-white">
                <span className="mb-3 inline-flex w-fit rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                  Sản phẩm nổi bật
                </span>
                <h1 className="mb-2 text-[32px] font-bold leading-[1.2] tracking-[-0.02em]">
                  {heroProduct.name}
                </h1>
                <p className="mb-6 text-lg font-semibold leading-[1.4] text-white/90">
                  {heroProduct.short_description || 'Hiệu năng mạnh mẽ, thiết kế cao cấp và mức giá tốt cho khách hàng đang tìm sản phẩm nổi bật.'}
                </p>
                <div className="mb-8">
                  <span className="block text-xs text-white/80">Từ</span>
                  <span className="text-2xl font-bold leading-[1.3]">{formatVND(heroProduct.final_price)}</span>
                </div>
                <Link
                  to={ROUTES.PRODUCT_DETAIL(heroProduct.id)}
                  className="inline-flex w-fit items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#630ed4] shadow-lg transition hover:bg-white/90"
                >
                  Mua ngay
                </Link>
              </div>
            ) : (
              <div className="min-h-[400px] rounded-xl bg-gradient-to-br from-[#630ed4] to-[#674bb5] p-8">
                <LoadingSkeleton className="space-y-5" rows={5} />
              </div>
            )}
          </div>

          <div className="col-span-12 overflow-hidden rounded-xl border border-[#e5e2e1] bg-white p-4 md:col-span-4">
            {heroProduct ? (
              <Link
                to={ROUTES.PRODUCT_DETAIL(heroProduct.id)}
                className="flex h-full min-h-[400px] items-center justify-center"
              >
                <ProductImage
                  src={heroProduct.thumbnail_url}
                  alt={heroProduct.name}
                  className="h-full w-full"
                  imgClassName="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                />
              </Link>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center">
                <LoadingSkeleton className="w-full" rows={4} />
              </div>
            )}
          </div>

          <div className="col-span-12 flex flex-col gap-4 md:col-span-3">
            {promoProducts.length > 0 ? (
              promoProducts.map((product) => (
                <Link
                  key={product.id}
                  to={ROUTES.PRODUCT_DETAIL(product.id)}
                  className="flex flex-1 items-center gap-4 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-5 transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-lg font-semibold leading-[1.4] text-[#1c1b1b]">
                      {formatProductName(product.name)}
                    </h3>
                    <p className="mt-1 text-lg font-bold text-[#630ed4]">
                      {product.discount_percent > 0 ? `Giảm ${product.discount_percent}%` : formatVND(product.final_price)}
                    </p>
                    <span className="mt-2 inline-block text-sm font-semibold text-[#630ed4] hover:underline">
                      Mua ngay
                    </span>
                  </div>
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white p-2">
                    <ProductImage src={product.thumbnail_url} alt={formatProductName(product.name)} imgClassName="h-full w-full object-contain" />
                  </div>
                </Link>
              ))
            ) : (
              <>
                <div className="rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-5">
                  <LoadingSkeleton rows={4} />
                </div>
                <div className="rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-5">
                  <LoadingSkeleton rows={4} />
                </div>
              </>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 rounded-xl border border-[#e5e2e1] bg-white p-6 shadow-sm md:grid-cols-4">
          {[
            ['local_shipping', 'Miễn phí giao hàng', 'Cho đơn từ 500k'],
            ['verified_user', 'Thanh toán an toàn', '100% bảo mật'],
            ['keyboard_return', 'Đổi trả dễ dàng', 'Trong 7 ngày'],
            ['support_agent', 'Hỗ trợ 24/7', 'Hotline: 1900 1234'],
          ].map(([icon, title, subtitle]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#630ed4]">{icon}</span>
              <div>
                <h4 className="text-sm font-semibold">{title}</h4>
                <p className="text-xs text-[#4a4455]">{subtitle}</p>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold leading-[1.3] text-[#1c1b1b]">Danh mục sản phẩm</h2>
            <Link to={ROUTES.PRODUCTS} className="text-sm font-semibold text-[#630ed4] hover:underline">
              Xem tất cả &gt;
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center">
            {isCategoriesLoading && effectiveCategories.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="min-w-[100px]">
                    <LoadingSkeleton rows={2} />
                  </div>
                ))
              : quickNavCategories.map((category) => {
                  const showcaseMatch = showcaseCategories.find((item) => item.id === category.id)

                  return showcaseMatch ? (
                    <a
                      key={category.id}
                      href={`#${getCategoryAnchor(showcaseMatch)}`}
                      className="group flex min-w-[100px] flex-col items-center gap-2"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eae7e7] transition-colors group-hover:bg-[#7c3aed]">
                        <span className="material-symbols-outlined text-3xl text-[#4a4455] transition-colors group-hover:text-white">
                          {getCategoryIcon(category.name)}
                        </span>
                      </div>
                      <span className="text-center text-sm font-medium">{category.name}</span>
                    </a>
                  ) : (
                    <Link
                      key={category.id}
                      to={`/${category.slug}`}
                      className="group flex min-w-[100px] flex-col items-center gap-2"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eae7e7] transition-colors group-hover:bg-[#7c3aed]">
                        <span className="material-symbols-outlined text-3xl text-[#4a4455] transition-colors group-hover:text-white">
                          {getCategoryIcon(category.name)}
                        </span>
                      </div>
                      <span className="text-center text-sm font-medium">{category.name}</span>
                    </Link>
                  )
                })}
          </div>
        </section>

        {showcaseCategories.map((category, index) => {
          const query = categoryProductQueries[index]
          const products =
            query?.data?.data?.length
              ? prioritizeProducts(query.data.data)
              : prioritizeProducts(featuredProducts.filter((product) => product.category_id === category.id)).slice(0, 5)
          const anchor = getCategoryAnchor(category)

          return (
            <section id={anchor} key={category.id}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold leading-[1.3] text-[#1c1b1b]">
                  {getSectionTitle(category.name)}
                </h2>
                <Link
                  to={`/${category.slug}`}
                  className="text-sm font-semibold text-[#630ed4] hover:underline"
                >
                  {getViewAllLabel(category.name)} &gt;
                </Link>
              </div>

              {query?.isLoading ? (
                <CategorySectionSkeleton />
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  {products.map((product) => (
                    <HomeProductCard
                      key={product.id}
                      product={product}
                      emphasized={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#ccc3d8] bg-white px-6 py-10 text-center text-sm text-[#4a4455]">
                  Chưa có sản phẩm cho danh mục này.
                </div>
              )}
            </section>
          )
        })}

        {showcaseCategories.length === 0 && (
          <section id="san-pham-noi-bat">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold leading-[1.3] text-[#1c1b1b]">Sản phẩm nổi bật</h2>
              <Link to={ROUTES.PRODUCTS} className="text-sm font-semibold text-[#630ed4] hover:underline">
                Xem tất cả &gt;
              </Link>
            </div>

            {isFeaturedProductsLoading ? (
              <CategorySectionSkeleton />
            ) : featuredFallbackProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {featuredFallbackProducts.map((product) => (
                  <HomeProductCard
                    key={product.id}
                    product={product}
                    emphasized={false}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#ccc3d8] bg-white px-6 py-10 text-center text-sm text-[#4a4455]">
                Không lấy được dữ liệu sản phẩm từ backend.
              </div>
            )}
          </section>
        )}

        <section
          id={accessoryCategory ? getCategoryAnchor(accessoryCategory) : 'phu-kien'}
          className="overflow-hidden rounded-2xl bg-[#f0eded]"
        >
          <div className="flex flex-col items-center md:flex-row">
            <div className="flex-1 space-y-4 p-10">
              <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1c1b1b]">
                {accessoryCategory ? accessoryCategory.name : 'Sản phẩm nổi bật'}
              </h2>
              <p className="text-lg font-semibold leading-[1.4] text-[#630ed4]">
                {accessoryProduct?.discount_percent
                  ? `Giảm đến ${accessoryProduct.discount_percent}%`
                  : `${accessoryCategory?.product_count ?? featuredProducts.length} sản phẩm đang mở bán`}
              </p>
              <Link
                to={
                  accessoryCategory
                    ? `/${accessoryCategory.slug}`
                    : ROUTES.PRODUCTS
                }
                className="inline-flex rounded-xl bg-[#630ed4] px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Mua ngay
              </Link>
            </div>

            <div className="flex flex-1 justify-center p-6">
              {accessoryProduct ? (
                <Link
                  to={ROUTES.PRODUCT_DETAIL(accessoryProduct.id)}
                  className="flex w-full max-w-[420px] items-center justify-center rounded-2xl bg-white/70 p-6 shadow-2xl"
                >
                  <ProductImage
                    src={accessoryProduct.thumbnail_url}
                    alt={accessoryProduct.name}
                    className="h-full w-full"
                    imgClassName="max-h-[320px] w-full object-contain"
                  />
                </Link>
              ) : isFeaturedProductsLoading ? (
                <div className="w-full max-w-[420px] rounded-2xl bg-white/70 p-6">
                  <LoadingSkeleton rows={4} />
                </div>
              ) : null}
            </div>
          </div>
        </section>
        </main>
      </div>
    </div>
  )
}
