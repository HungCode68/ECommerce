import { ProductGrid } from './ProductGrid'
import type { Product } from '@/types/product.types'

type RelatedProductsProps = {
  products: Product[]
  isLoading?: boolean
}

export function RelatedProducts({
  products,
  isLoading = false,
}: RelatedProductsProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1c1b1b]">Sản phẩm liên quan</h2>
        <p className="text-sm text-[#4a4455]">Khám phá thêm các sản phẩm cùng danh mục.</p>
      </div>
      <ProductGrid products={products} isLoading={isLoading} viewMode="grid" />
    </section>
  )
}
