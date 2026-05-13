import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/utils/constants'

export function EmptyCart() {
  return (
    <section className="rounded-2xl border border-[#ccc3d8] bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#630ed4]/10 text-[#630ed4]">
        <ShoppingCart className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[#1c1b1b]">Giỏ hàng của bạn đang trống</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-[#4a4455]">
        Hãy thêm sản phẩm yêu thích vào giỏ để tiếp tục mua sắm và hoàn tất đơn hàng.
      </p>
      <Link
        to={ROUTES.PRODUCTS}
        className="mt-6 inline-flex rounded-xl bg-[#630ed4] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Tiếp tục mua sắm
      </Link>
    </section>
  )
}
