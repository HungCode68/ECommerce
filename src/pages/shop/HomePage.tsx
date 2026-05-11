import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/utils/constants'
import { productApi } from '@/api/product.api'
import { bannerApi } from '@/api/banner.api'
import { queryKeys } from '@/lib/queryKeys'
import { ProductCard } from '@/features/shop/products/ProductCard'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatVND } from '@/utils/formatters/format'
import { useAuthStore } from '@/store/authStore'
import type { Banner } from '@/types/banner.types'

export function HomePage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const { data: productsData, isLoading } = useQuery({
    queryKey: queryKeys.products.list({ limit: 6 }),
    queryFn: () => productApi.search({ limit: 6 }),
  })

  const { data: recentProductsData } = useQuery({
    queryKey: queryKeys.products.list({ limit: 3, sort_by: 'created_at', sort_order: 'desc' }),
    queryFn: () => productApi.search({ limit: 3, sort_by: 'created_at', sort_order: 'desc' }),
  })

  const { data: heroBannersData } = useQuery({
    queryKey: queryKeys.banners.list('home_hero'),
    queryFn: () => bannerApi.getActive('home_hero'),
  })

  const products = productsData?.data || []
  const recentProducts = recentProductsData?.data || []
  const heroBannerSlots = [1, 2]
    .map((sortOrder) => {
      const slotBanner = heroBannersData?.find((banner) => banner.sort_order === sortOrder)
      if (!slotBanner) return null

      return {
        slotKey: `home_hero_${sortOrder}`,
        banner: slotBanner,
      }
    })
    .filter((slot): slot is { slotKey: string; banner: Banner } => Boolean(slot))

  return (
    <div className="pb-24">
      {/* Hero Promotional Banners */}
      {heroBannerSlots.length > 0 && (
        <section className="mx-auto mb-12 max-w-screen-2xl px-2 md:px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {heroBannerSlots.map(({ slotKey, banner }) => (
              <div
                key={slotKey}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link to={banner.link_url || ROUTES.PRODUCTS} className="block">
                  <div className="aspect-[21/8] w-full overflow-hidden bg-slate-100">
                    <picture>
                      {banner.mobile_image_url && (
                        <source media="(max-width: 767px)" srcSet={banner.mobile_image_url} />
                      )}
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    </picture>
                  </div>
                </Link>

                {isAdmin && (
                  <Link
                    to={`${ROUTES.ADMIN_SETTINGS}?slot=${slotKey}`}
                    className="absolute right-3 top-3 rounded-full bg-slate-900/82 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-slate-900"
                  >
                    Sửa banner
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed & Recommended Bento Grid */}
      <section className="max-w-screen-2xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24">
        <div className="lg:col-span-8">
          <h2 className="text-2xl md:text-3xl font-headline font-bold mb-8 uppercase tracking-tight">GỢI Ý RIÊNG CHO BẠN</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingSkeleton key={i} className="h-[400px] rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="col-span-1 sm:col-span-3 bg-primary-container/5 p-8 border border-primary-container/20 flex justify-between items-center relative overflow-hidden group mt-6 rounded-3xl">
            <div className="relative z-10">
              <h3 className="text-2xl font-headline font-bold mb-2">XÂY DỰNG CẤU HÌNH CỦA RIÊNG BẠN</h3>
              <p className="text-on-surface-variant max-w-sm mb-6">Tùy chọn linh kiện cao cấp từ KC29 TECH để tạo ra cỗ máy chiến đấu thực thụ.</p>
              <Link to={ROUTES.PRODUCTS} className="bg-primary text-white px-6 py-3 font-label font-bold text-xs rounded-full hover:shadow-lg transition-shadow inline-block">
                BẮT ĐẦU CẤU HÌNH
              </Link>
            </div>
            <span className="material-symbols-outlined text-[160px] absolute -right-8 -bottom-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">settings_suggest</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container p-8 h-full rounded-3xl">
          <h2 className="text-xl font-headline font-bold mb-8 flex justify-between items-center">
            MỚI CẬP NHẬT
            <Link to={ROUTES.PRODUCTS} className="text-primary font-label text-[10px] font-bold hover:underline transition-colors">XEM TẤT CẢ</Link>
          </h2>

          <div className="space-y-6">
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <div key={product.id}>
                  <Link to={ROUTES.PRODUCT_DETAIL(product.id)} className="flex gap-4 items-center group cursor-pointer">
                    <div className="w-20 h-20 bg-white p-2 rounded-xl shrink-0 overflow-hidden">
                      <div className="w-full h-full bg-surface-variant flex items-center justify-center rounded-lg group-hover:bg-primary/5 transition-colors overflow-hidden">
                        <img
                          src="https://lh3.googleusercontent.com/aida/ADBb0ui0Sn7vY1W8msHWD6mxuGsJV_rdw0aBLFlNFjO7l8WvU19Z5yo21ihfFAz-ltxm5qASFT0wTWkGBqBKLgWMwRknnX-INlFb5Z2Ly5tdXCKHM5VKwJIphO895gCHJ_HnbfSz2hf-KwphOvUSs7AkA2cge-F5yQPTQrx53jhQDXwhFd0r4Omhd5veg_qCGWS2BkAnxfPN_HLtQZnBcoQRgkOYNwdzc5Jgdpme8THgAyyg1-6rsoFUnKe9FO71LB6CrLqHUhYIF3YPZA"
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{product.name}</h4>
                      <p className="text-primary font-headline font-bold text-sm mt-1">{formatVND(product.final_price || product.min_price || 0)}</p>
                    </div>
                  </Link>
                  <div className="h-[1px] bg-outline-variant/30 mt-6 last:hidden"></div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant italic">Đang cập nhật sản phẩm mới...</p>
            )}
          </div>

          <Link
            to={ROUTES.PRODUCTS}
            className="block w-full mt-12 py-4 bg-white border border-outline-variant text-on-surface text-center font-label text-xs font-bold hover:bg-surface-container-high transition-colors rounded-xl"
          >
            KHÁM PHÁ DANH SÁCH
          </Link>
        </div>
      </section>
    </div>
  )
}
