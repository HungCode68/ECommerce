import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Tag } from 'lucide-react'
import axios from 'axios'
import { cartApi } from '@/api/cart.api'
import { orderApi } from '@/api/order.api'
import { addressApi } from '@/api/address.api'
import { couponApi } from '@/api/coupon.api'
import { queryKeys } from '@/lib/queryKeys'
import { useCartStore } from '@/store/cartStore'
import { formatVND } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'

const checkoutSchema = z.object({
  address_id: z.coerce.number().min(1, 'Chọn địa chỉ giao hàng'),
  payment_method: z.enum(['cod', 'bank_transfer']),
  note: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutPage() {
  const navigate = useNavigate()
  const { selectedIds } = useCartStore()
  const qc = useQueryClient()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)

  const { data: cart } = useQuery({ queryKey: queryKeys.cart, queryFn: cartApi.getCart })
  const { data: addresses } = useQuery({
    queryKey: queryKeys.addressKeys.all,
    queryFn: addressApi.getList,
  })

  const checkedItems = (cart?.items ?? []).filter((i) => selectedIds.includes(i.id))
  const subtotal = checkedItems.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const shippingFee = subtotal >= 500_000 ? 0 : 30_000
  const total = subtotal + shippingFee - discount

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: 'cod' },
  })

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: (data: CheckoutFormData) =>
      orderApi.create({
        address_id: data.address_id,
        payment_method: data.payment_method,
        note: data.note,
        items: checkedItems.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
        })),
        order_coupon_code: couponCode || undefined,
      }),
    onSuccess: (order) => {
      toast.success('Đặt hàng thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.cart })
      navigate(ROUTES.ORDER_DETAIL(order.id))
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Vui lòng xác minh email trước khi đặt hàng')
        navigate(ROUTES.PROFILE)
        return
      }
      toast.error('Đặt hàng thất bại, vui lòng thử lại')
    },
  })

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const result = await couponApi.apply({ code: couponCode, order_amount: subtotal })
      setDiscount(result.discount)
      toast.success(`Áp dụng mã thành công! Giảm ${formatVND(result.discount)}`)
    } catch {
      toast.error('Mã giảm giá không hợp lệ')
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-slate-900">Thanh toán</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit((d) => placeOrder(d))} className="lg:col-span-2 space-y-5">
          {/* Address */}
          <div className="rounded-xl border border-slate-100 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-800">Địa chỉ giao hàng</h2>
            {addresses && addresses.length > 0 ? (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                      Number(watch('address_id')) === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-primary/50',
                    )}
                  >
                    <input type="radio" {...register('address_id')} value={addr.id} className="mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-slate-800">{addr.receiver_name}</p>
                      <p className="text-slate-500">{addr.receiver_phone}</p>
                      <p className="text-slate-400">{addr.address_detail}, {addr.ward}, {addr.district}, {addr.province}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Bạn chưa có địa chỉ.{' '}
                <a href="/dia-chi" className="text-primary hover:underline">Thêm địa chỉ</a>
              </p>
            )}
            {errors.address_id && <p className="mt-2 text-xs text-red-500">{errors.address_id.message}</p>}
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-slate-100 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-800">Phương thức thanh toán</h2>
            <div className="space-y-2">
              {[
                { value: 'cod', label: 'Thanh toán tiền mặt khi nhận hàng (COD)' },
                { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' },
              ].map((pm) => (
                <label
                  key={pm.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                    watch('payment_method') === pm.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary/50',
                  )}
                >
                  <input type="radio" {...register('payment_method')} value={pm.value} />
                  <span className="text-sm text-slate-700">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="rounded-xl border border-slate-100 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Ghi chú</h2>
            <textarea
              {...register('note')}
              rows={2}
              placeholder="Ghi chú cho đơn hàng..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || checkedItems.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            Đặt hàng ({formatVND(total)})
          </button>
        </form>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Đơn hàng ({checkedItems.length})</h2>
          {checkedItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600 truncate mr-2">{item.product_name} x{item.quantity}</span>
              <span className="shrink-0">{formatVND(item.price * item.quantity)}</span>
            </div>
          ))}

          {/* Coupon */}
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Mã giảm giá"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading}
              className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
              Áp dụng
            </button>
          </div>

          <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
            <div className="flex justify-between text-slate-600"><span>Tạm tính</span><span>{formatVND(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? <span className="text-green-600">Miễn phí</span> : formatVND(shippingFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatVND(discount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatVND(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
