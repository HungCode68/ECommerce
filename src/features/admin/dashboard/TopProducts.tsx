import { formatShortCurrency } from '@/utils/adminDashboard'
import type { TopProduct } from '@/types/adminStats.types'

type TopProductsProps = {
  data: TopProduct[]
}

export function TopProducts({ data }: TopProductsProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        Sản phẩm sắp hết hàng
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={`${item.product_id}-${item.variant_id}`} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {item.product_name}
              </p>
              <p className="text-xs text-slate-400">
                {item.variant_title ? `${item.variant_title} · ` : ''}
                {item.sku}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-900">
              {formatShortCurrency(item.stock_quantity)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
