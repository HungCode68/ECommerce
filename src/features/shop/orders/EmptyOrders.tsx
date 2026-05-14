import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

type EmptyOrdersProps = {
  title?: string
  description?: string
}

export function EmptyOrders({
  title = 'Bạn chưa có đơn hàng nào',
  description = 'Hãy khám phá các sản phẩm công nghệ nổi bật và bắt đầu đơn hàng đầu tiên của bạn.',
}: EmptyOrdersProps) {
  return (
    <div className="rounded-3xl border border-dashed border-[#ccc3d8] bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0eded] text-[#630ed4]">
        <Package className="h-9 w-9" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-[#1c1b1b]">{title}</h2>
      <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-[#7b7487]">{description}</p>
      <Link
        to={ROUTES.PRODUCTS}
        className="inline-flex items-center justify-center rounded-xl bg-[#630ed4] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  )
}
