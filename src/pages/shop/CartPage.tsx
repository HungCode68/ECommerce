import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, ShoppingBag } from 'lucide-react'
import { cartApi } from '@/api/cart.api'
import { queryKeys } from '@/lib/queryKeys'
import { useCartStore } from '@/store/cartStore'
import { formatVND } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

export function CartPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { selectedIds, toggleSelect, toggleSelectAll } = useCartStore()

  const { data: cart, isLoading } = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.getCart,
  })

  const { mutate: removeItems, isPending: removing } = useMutation({
    mutationFn: (itemId: number) => cartApi.removeItems({ item_ids: [itemId] }),
    onSuccess: () => {
      toast.success('Đã xóa khỏi giỏ hàng')
      qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })

  const { mutate: updateQty } = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateItem(itemId, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart }),
  })

  const items = cart?.items ?? []
  const checkedItems = items.filter((item) => selectedIds.includes(item.id))
  const subtotal = checkedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  )

  if (isLoading) return <div className="container mx-auto px-4 py-8"><TableSkeleton rows={4} cols={4} /></div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-slate-900">
        Giỏ hàng ({items.length})
      </h1>

      {items.length === 0 ? (
        <EmptyState
          title="Giỏ hàng trống"
          description="Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm"
          icon={<ShoppingBag className="h-8 w-8" />}
          action={
            <Link to={ROUTES.PRODUCTS} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
              Mua sắm ngay
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-slate-300"
              />
              Chọn tất cả
            </label>

            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="rounded border-slate-300"
                />
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-slate-800">{item.product_name}</p>
                  <p className="text-xs text-slate-400">{item.variant_info}</p>
                  <p className="mt-1 font-semibold text-primary">{formatVND(item.price)}</p>
                </div>
                <div className="flex items-center rounded-lg border border-slate-200">
                  <button
                    onClick={() => updateQty({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900"
                  >-</button>
                  <span className="px-3 py-1.5 text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQty({ itemId: item.id, quantity: item.quantity + 1 })}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900"
                  >+</button>
                </div>
                <button
                  onClick={() => removeItems(item.id)}
                  disabled={removing}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="h-fit rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-900">Tóm tắt đơn hàng</h2>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Đã chọn ({checkedItems.length} sản phẩm)</span>
              <span className="font-medium">{formatVND(subtotal)}</span>
            </div>
            <p className="text-xs text-slate-400">Phí vận chuyển sẽ được tính ở bước thanh toán</p>
            <button
              onClick={() => navigate(ROUTES.CHECKOUT)}
              disabled={checkedItems.length === 0}
              className="flex w-full items-center justify-center rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
