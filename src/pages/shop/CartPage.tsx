import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { cartApi } from '@/api/cart.api'
import { couponApi } from '@/api/coupon.api'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { useCartStore } from '@/store/cartStore'
import { ROUTES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/httpError'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { CartItem } from '@/features/shop/cart/CartItem'
import { CartSummary } from '@/features/shop/cart/CartSummary'
import { EmptyCart } from '@/features/shop/cart/EmptyCart'
import { RecommendedProducts } from '@/features/shop/cart/RecommendedProducts'
import type { CartItem as CartItemType } from '@/types/cart.types'

export function CartPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const {
    selectedIds,
    setCart,
    toggleSelect,
    toggleSelectAll,
    clearSelected,
  } = useCartStore()

  const { data: cart, isLoading } = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.getCart,
  })

  const { data: recommendedData, isLoading: recommendedLoading } = useQuery({
    queryKey: queryKeys.products.list({ source: 'cart-recommended', limit: 10 }),
    queryFn: () => productApi.search({ page: 1, limit: 10 }),
    staleTime: 5 * 60 * 1000,
  })

  const { mutate: removeOneItem, isPending: removingOne } = useMutation({
    mutationFn: (item: CartItemType) =>
      cartApi.removeItems({ item_ids: [item.item_id], variant_ids: [item.variant_id] }),
    onSuccess: () => {
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
      qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Xóa sản phẩm thất bại')),
  })

  const { mutate: removeSelectedItems, isPending: removingSelected } = useMutation({
    mutationFn: (selectedItems: CartItemType[]) =>
      cartApi.removeItems({
        item_ids: selectedItems.map((item) => item.item_id),
        variant_ids: selectedItems.map((item) => item.variant_id),
      }),
    onSuccess: () => {
      clearSelected()
      toast.success('Đã xóa các sản phẩm đã chọn')
      qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Xóa sản phẩm thất bại')),
  })

  const { mutate: updateQty, isPending: updatingQty } = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateItem(itemId, { quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Cập nhật số lượng thất bại')),
  })

  const { mutate: applyCoupon, isPending: applyingCoupon } = useMutation({
    mutationFn: () => couponApi.apply({ code: couponCode.trim(), order_amount: subtotal }),
    onSuccess: (result) => {
      setDiscount(result.discount)
      toast.success(result.message || 'Áp dụng mã giảm giá thành công')
    },
    onError: (error) => {
      setDiscount(0)
      toast.error(getErrorMessage(error, 'Mã giảm giá không hợp lệ'))
    },
  })

  const items = cart?.items ?? []
  const checkedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.variant_id)),
    [items, selectedIds],
  )
  const subtotal = checkedItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shippingFee = checkedItems.length === 0 ? 0 : subtotal >= 500_000 ? 0 : 30_000
  const total = Math.max(0, subtotal + shippingFee - discount)
  const allSelected = items.length > 0 && checkedItems.length === items.length
  const busy = removingOne || removingSelected || updatingQty

  useEffect(() => {
    setCart(items)
  }, [items, setCart])

  useEffect(() => {
    if (items.length === 0) {
      clearSelected()
      return
    }

    const itemIdSet = new Set(items.map((item) => item.variant_id))
    const hasInvalidSelection = selectedIds.some((id) => !itemIdSet.has(id))

    if (hasInvalidSelection) {
      clearSelected()
    }
  }, [items, clearSelected, selectedIds])

  useEffect(() => {
    setDiscount(0)
  }, [subtotal])

  const recommendedProducts = (recommendedData?.data ?? [])
    .filter((product) => !items.some((item) => item.product_id === product.id))
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
        <TableSkeleton rows={4} cols={4} />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
      <div className="mb-8 flex items-baseline gap-2">
        <h1 className="text-3xl font-bold text-[#1c1b1b]">Giỏ hàng</h1>
        <span className="text-sm text-[#4a4455]">({items.length} sản phẩm)</span>
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-6">
            <section className="lg:col-span-8 space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-[#ccc3d8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-lg font-semibold text-[#1c1b1b]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-5 w-5 rounded border-[#ccc3d8] text-[#630ed4] focus:ring-[#630ed4]"
                  />
                  Chọn tất cả
                </label>

                <button
                  type="button"
                  onClick={() => removeSelectedItems(checkedItems)}
                  disabled={checkedItems.length === 0 || removingSelected}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#ba1a1a] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa mục đã chọn
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <CartItem
                    key={item.item_id}
                    item={item}
                    checked={selectedIds.includes(item.variant_id)}
                    onToggle={() => toggleSelect(item.variant_id)}
                    onDecrease={() =>
                      updateQty({ itemId: item.item_id, quantity: Math.max(1, item.quantity - 1) })
                    }
                    onIncrease={() =>
                      updateQty({ itemId: item.item_id, quantity: Math.min(item.stock_quantity, item.quantity + 1) })
                    }
                    onRemove={() => removeOneItem(item)}
                    disabled={busy}
                  />
                ))}
              </div>

              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#630ed4] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Tiếp tục mua sắm
              </Link>
            </section>

            <aside className="lg:col-span-4">
              <CartSummary
                couponCode={couponCode}
                onCouponCodeChange={setCouponCode}
                onApplyCoupon={() => applyCoupon()}
                couponLoading={applyingCoupon}
                subtotal={subtotal}
                shippingFee={shippingFee}
                discount={discount}
                total={total}
                onCheckout={() => navigate(ROUTES.CHECKOUT)}
                checkoutDisabled={checkedItems.length === 0}
              />
            </aside>
          </div>

          <RecommendedProducts products={recommendedProducts} isLoading={recommendedLoading} />
        </>
      )}
    </main>
  )
}
