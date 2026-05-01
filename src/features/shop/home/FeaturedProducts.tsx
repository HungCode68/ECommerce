import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ProductCard } from '@/features/shop/products/ProductCard'
import { ROUTES } from '@/utils/constants'

export function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.list({ page: 1, limit: 8 }),
    queryFn: () => productApi.search({ page: 1, limit: 8 }),
  })

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">
            Sản phẩm nổi bật
          </h2>
          <p className="text-sm text-slate-500">Được lựa chọn nhiều nhất</p>
        </div>
        <Link
          to={ROUTES.PRODUCTS}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Xem tất cả <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <CardSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(data?.data ?? []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
