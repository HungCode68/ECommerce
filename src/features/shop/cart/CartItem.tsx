import { Minus, Plus, Trash2 } from 'lucide-react'
import { ProductImage } from '@/components/shared/ProductImage'
import { formatVND } from '@/utils/formatters/format'
import type { CartItem as CartItemType } from '@/types/cart.types'

type CartItemProps = {
  item: CartItemType
  checked: boolean
  onToggle: () => void
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
  disabled?: boolean
}

export function CartItem({
  item,
  checked,
  onToggle,
  onDecrease,
  onIncrease,
  onRemove,
  disabled,
}: CartItemProps) {
  return (
    <article className="rounded-xl border border-[#ccc3d8] bg-white p-4 transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-5 w-5 shrink-0 rounded border-[#ccc3d8] text-[#630ed4] focus:ring-[#630ed4]"
        />

        <div className="flex min-w-0 flex-1 gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f6f3f2]">
            <ProductImage
              src={item.thumbnail_url}
              alt={item.product_name}
              className="h-full w-full"
              imgClassName="h-full w-full object-contain p-2"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-semibold text-[#1c1b1b]">{item.product_name}</h3>
            <p className="mt-1 text-sm text-[#4a4455]">{item.variant_info || 'Phiên bản tiêu chuẩn'}</p>
            <p className="mt-2 text-base font-bold text-[#630ed4]">{formatVND(item.price)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <div className="flex items-center overflow-hidden rounded-lg border border-[#ccc3d8]">
            <button
              type="button"
              onClick={onDecrease}
              disabled={disabled || item.quantity <= 1}
              className="border-r border-[#ccc3d8] px-3 py-2 text-[#4a4455] transition hover:bg-[#f0eded] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Giảm số lượng"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-10 px-3 text-center text-sm font-semibold text-[#1c1b1b]">{item.quantity}</span>
            <button
              type="button"
              onClick={onIncrease}
              disabled={disabled || item.quantity >= item.stock}
              className="border-l border-[#ccc3d8] px-3 py-2 text-[#4a4455] transition hover:bg-[#f0eded] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Tăng số lượng"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-right text-base font-bold text-[#630ed4]">
              {formatVND(item.price * item.quantity)}
            </span>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="rounded-lg p-2 text-[#4a4455] transition hover:bg-red-50 hover:text-[#ba1a1a] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Xóa sản phẩm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
