import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, MapPin, ShieldCheck, Tag, Truck } from 'lucide-react'
import axios from 'axios'
import { cartApi } from '@/api/cart.api'
import { orderApi } from '@/api/order.api'
import { addressApi } from '@/api/address.api'
import { couponApi } from '@/api/coupon.api'
import { queryKeys } from '@/lib/queryKeys'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatProductName, formatVND } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'
import { ProductImage } from '@/components/shared/ProductImage'

const checkoutSchema = z.object({
  address_id: z.coerce.number().min(1, 'Chọn địa chỉ giao hàng'),
  payment_method: z.enum(['cod', 'bank_transfer']),
  note: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

const addressSchema = z.object({
  receiver_name: z.string().min(2, 'Nhập tên người nhận'),
  receiver_phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  province: z.string().min(2, 'Nhập tỉnh/thành phố'),
  district: z.string().optional(),
  ward: z.string().min(2, 'Nhập phường/xã'),
  address_detail: z.string().min(5, 'Nhập địa chỉ chi tiết'),
  is_default: z.boolean().optional(),
})

type AddressFormData = z.infer<typeof addressSchema>

export function CheckoutPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { selectedIds, buyNowItem, clearBuyNow } = useCartStore()
  const qc = useQueryClient()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCode, setAppliedCode] = useState('')
  
  // State for inline address creation form
  const [showAddressForm, setShowAddressForm] = useState(false)

  const { data: cart } = useQuery({ queryKey: queryKeys.cart, queryFn: cartApi.getCart, enabled: isAuthenticated })
  const { data: addresses } = useQuery({
    queryKey: queryKeys.addressKeys.all,
    queryFn: addressApi.getList,
    enabled: isAuthenticated,
  })

  // Buy Now flow: use the stored item directly (not from cart)
  // Cart checkout flow: filter cart items by selectedIds
  const checkedItems: Array<{
    product_id: number
    variant_id: number
    quantity: number
    price: number
    product_name: string
    variant_name: string
    thumbnail_url: string
    item_id?: number
  }> = buyNowItem
    ? [buyNowItem]
    : (cart?.items ?? []).filter((i) => selectedIds.includes(i.item_id))

  const subtotal = checkedItems.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const shippingFee = subtotal >= 500_000 ? 0 : 30_000
  const total = subtotal + shippingFee - discount
  const totalQuantity = checkedItems.reduce((acc, item) => acc + item.quantity, 0)

  const { data: availableCoupons } = useQuery({
    queryKey: ['available-coupons', subtotal],
    queryFn: () => couponApi.getAvailable({ order_amount: subtotal }),
    enabled: subtotal > 0,
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: 'cod' },
  })

  const {
    register: registerAddr,
    handleSubmit: handleSubmitAddr,
    reset: resetAddr,
    setError: setErrorAddr,
    formState: { errors: errorsAddr },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { is_default: false },
  })

  const { mutate: saveAddress, isPending: savingAddress } = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const payload = {
        receiver_name: data.receiver_name,
        receiver_phone: data.receiver_phone,
        province: data.province,
        district: data.district ?? '',
        ward: data.ward,
        address_detail: data.address_detail,
        is_default: Boolean(data.is_default),
      }
      return addressApi.create(payload)
    },
    onSuccess: (saved) => {
      toast.success('Đã thêm địa chỉ mới')
      setShowAddressForm(false)
      resetAddr({ is_default: false })
      qc.invalidateQueries({ queryKey: queryKeys.addressKeys.all })
      setValue('address_id', saved.id)
    },
    onError: (error: any) => {
      const responseData = error?.response?.data
      const validationErrors = responseData?.errors
      
      if (validationErrors && typeof validationErrors === 'object') {
        Object.entries(validationErrors).forEach(([field, msg]) => {
          const fieldLower = field.toLowerCase()
          let formField: keyof AddressFormData | null = null
          
          if (fieldLower.includes('name')) formField = 'receiver_name'
          else if (fieldLower.includes('phone')) formField = 'receiver_phone'
          else if (fieldLower.includes('province') || fieldLower.includes('state')) formField = 'province'
          else if (fieldLower.includes('ward') || fieldLower.includes('city')) formField = 'ward'
          else if (fieldLower.includes('detail') || fieldLower.includes('line1')) formField = 'address_detail'
          else if (fieldLower.includes('district')) formField = 'district'
          
          if (formField) {
            setErrorAddr(formField, { type: 'server', message: String(msg) })
          }
        })
        toast.error('Vui lòng kiểm tra lại các thông tin lỗi màu đỏ')
      } else {
        const errMsg = responseData?.message || 'Không thể lưu địa chỉ'
        toast.error(errMsg)
      }
    },
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
        order_coupon_code: appliedCode || undefined,
      }),
    onSuccess: (order) => {
      toast.success('Đặt hàng thành công!')
      clearBuyNow()
      qc.invalidateQueries({ queryKey: queryKeys.cart })
      navigate(ROUTES.ORDER_DETAIL(order.order_number))
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
  const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập trước khi thanh toán!')
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { state: { from: ROUTES.CHECKOUT } })
      }, 1500)
      return
    }
    handleSubmit((d) => placeOrder(d))(e)
  }
  const applyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim()
    if (!code) return
    setCouponLoading(true)
    try {
      const result = await couponApi.apply({ code, order_amount: subtotal })
      setDiscount(result.discount)
      setAppliedCode(code)
      setCouponCode(code)
      toast.success(`Áp dụng mã thành công! Giảm ${formatVND(result.discount)}`)
    } catch {
      toast.error('Mã giảm giá không hợp lệ hoặc không đủ điều kiện')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setDiscount(0)
    setAppliedCode('')
    setCouponCode('')
    toast.info('Đã huỷ áp dụng mã giảm giá')
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 md:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to={ROUTES.CART}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại giỏ hàng
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Checkout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">
            Hoàn tất đơn hàng
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Xác nhận địa chỉ, phương thức thanh toán và tổng tiền trước khi đặt hàng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            {checkedItems.length} sản phẩm
          </span>
          <span className="rounded-full bg-primary/8 px-3 py-1.5 font-semibold text-primary">
            {totalQuantity} món
          </span>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <form onSubmit={handlePreSubmit} className="space-y-5">
          {/* Address */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Địa chỉ giao hàng</h2>
                  <p className="text-sm text-slate-500">Chọn nơi nhận hàng chính xác để tránh chậm đơn.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                {showAddressForm ? 'Đóng Form' : '+ Thêm địa chỉ mới'}
              </button>
            </div>

            {showAddressForm && (
              <div className="mb-5 rounded-[22px] border border-primary/20 bg-[#fffdfb] p-5 shadow-inner">
                <h3 className="mb-4 text-sm font-bold text-slate-800">Thêm địa chỉ nhận hàng mới</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">Họ và tên người nhận</label>
                    <input
                      {...registerAddr('receiver_name')}
                      placeholder="Nguyễn Văn A"
                      className={cn(
                        "w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2",
                        errorsAddr.receiver_name ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-primary focus:ring-primary/15"
                      )}
                    />
                    {errorsAddr.receiver_name && <p className="mt-1 text-[10px] text-red-500">{errorsAddr.receiver_name.message}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">Số điện thoại</label>
                    <input
                      {...registerAddr('receiver_phone')}
                      placeholder="0901234567"
                      className={cn(
                        "w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2",
                        errorsAddr.receiver_phone ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-primary focus:ring-primary/15"
                      )}
                    />
                    {errorsAddr.receiver_phone && <p className="mt-1 text-[10px] text-red-500">{errorsAddr.receiver_phone.message}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">Tỉnh / Thành phố</label>
                    <input
                      {...registerAddr('province')}
                      placeholder="Hồ Chí Minh"
                      className={cn(
                        "w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2",
                        errorsAddr.province ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-primary focus:ring-primary/15"
                      )}
                    />
                    {errorsAddr.province && <p className="mt-1 text-[10px] text-red-500">{errorsAddr.province.message}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">Phường / Xã</label>
                    <input
                      {...registerAddr('ward')}
                      placeholder="Phường Bến Nghé"
                      className={cn(
                        "w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2",
                        errorsAddr.ward ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-primary focus:ring-primary/15"
                      )}
                    />
                    {errorsAddr.ward && <p className="mt-1 text-[10px] text-red-500">{errorsAddr.ward.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold text-slate-600">Địa chỉ chi tiết</label>
                    <textarea
                      {...registerAddr('address_detail')}
                      rows={2}
                      placeholder="Số nhà, tên đường, khu phố..."
                      className={cn(
                        "w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2",
                        errorsAddr.address_detail ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-primary focus:ring-primary/15"
                      )}
                    />
                    {errorsAddr.address_detail && <p className="mt-1 text-[10px] text-red-500">{errorsAddr.address_detail.message}</p>}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false)
                      resetAddr({ is_default: false })
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={savingAddress}
                    onClick={handleSubmitAddr((data) => saveAddress(data))}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white hover:opacity-90 disabled:opacity-60 transition"
                  >
                    {savingAddress ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Lưu địa chỉ
                  </button>
                </div>
              </div>
            )}

            {addresses && addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors',
                      Number(watch('address_id')) === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-primary/50',
                    )}
                  >
                    <input type="radio" {...register('address_id')} value={addr.id} className="mt-0.5" />
                    <div className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{addr.receiver_name}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {addr.receiver_phone}
                        </span>
                      </div>
                      <p className="mt-2 leading-6 text-slate-500">
                        {addr.address_detail}, {addr.ward}, {addr.district}, {addr.province}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  Bạn chưa có địa chỉ giao hàng nào.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                >
                  + Thêm địa chỉ đầu tiên
                </button>
              </div>
            )}
            {errors.address_id && <p className="mt-2 text-xs text-red-500">{errors.address_id.message}</p>}
          </div>

          {/* Payment */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Phương thức thanh toán</h2>
                <p className="text-sm text-slate-500">Lựa chọn cách thanh toán phù hợp với đơn hàng này.</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { value: 'cod', label: 'Thanh toán tiền mặt khi nhận hàng (COD)' },
                { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' },
              ].map((pm) => (
                <label
                  key={pm.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors',
                    watch('payment_method') === pm.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary/50',
                  )}
                >
                  <input type="radio" {...register('payment_method')} value={pm.value} />
                  <span className="text-sm font-medium text-slate-700">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-bold text-slate-900">Ghi chú cho đơn hàng</h2>
            <textarea
              {...register('note')}
              rows={4}
              placeholder="Ghi chú cho đơn hàng..."
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CheckoutInfoTile icon={<Truck className="h-5 w-5" />} title="Giao hàng rõ ràng" description="Phí ship và địa chỉ nhận được hiển thị đầy đủ trước khi đặt." />
            <CheckoutInfoTile icon={<ShieldCheck className="h-5 w-5" />} title="Thanh toán an toàn" description="Xác thực thông tin và lưu lịch sử đơn hàng ngay sau khi chốt." />
            <CheckoutInfoTile icon={<CheckCircle2 className="h-5 w-5" />} title="Kiểm tra lần cuối" description="Toàn bộ sản phẩm, giá và mã giảm giá được tổng hợp ở cột phải." />
          </div>

          <button
            type="submit"
            disabled={isPending || checkedItems.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            Đặt hàng ({formatVND(total)})
          </button>
        </form>

        <div className="h-fit xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/60">Order Preview</p>
              <h2 className="mt-2 text-2xl font-black">Đơn hàng của bạn</h2>
              <p className="mt-2 text-sm text-white/70">
                {checkedItems.length} sản phẩm, {totalQuantity} món sẽ được xử lý ngay sau khi xác nhận.
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {checkedItems.map((item) => (
                  <div key={item.item_id} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <ProductImage src={item.thumbnail_url} alt={formatProductName(item.product_name)} imgClassName="h-full w-full object-contain p-2" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-semibold text-slate-900">{item.variant_name || formatProductName(item.product_name)}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.variant_name ? formatProductName(item.product_name) : 'Phiên bản tiêu chuẩn'}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">x{item.quantity}</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatVND(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/50">
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá"
                    disabled={couponLoading || !!appliedCode}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/20",
                      appliedCode 
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-800" 
                        : "border-slate-200 bg-white text-slate-800 focus:border-slate-400"
                    )}
                  />
                  {appliedCode ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 hover:text-red-700"
                    >
                      Huỷ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                      Áp dụng
                    </button>
                  )}
                </div>

                {appliedCode && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 font-semibold">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>
                    <div>
                      <p className="font-bold">Đã áp dụng mã: {appliedCode}</p>
                      <p className="text-[11px] text-emerald-600 font-normal">Giảm {formatVND(discount)} trực tiếp vào đơn hàng.</p>
                    </div>
                  </div>
                )}

                {/* Available Coupons list */}
                {availableCoupons && availableCoupons.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã giảm giá khả dụng</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {availableCoupons.map((coupon) => {
                        const isApplied = appliedCode === coupon.code
                        return (
                          <div 
                            key={coupon.id} 
                            className={cn(
                              "relative flex items-center justify-between gap-3 rounded-xl border p-3 bg-white transition shadow-sm overflow-hidden",
                              isApplied 
                                ? "border-emerald-500 bg-emerald-50/10 ring-1 ring-emerald-500" 
                                : "border-slate-200 hover:border-slate-300"
                            )}
                          >
                            {/* Decorative Left Ticket Edge */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-slate-50 rounded-r-full border-y border-r border-slate-200" />
                            
                            <div className="pl-2">
                              <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                {coupon.code}
                              </span>
                              <p className="mt-1.5 text-xs font-bold text-slate-800">
                                Giảm {coupon.type === 'percent' ? `${coupon.value}%` : formatVND(coupon.value)}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500">
                                Đơn tối thiểu {formatVND(coupon.min_order_amount)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => isApplied ? removeCoupon() : applyCoupon(coupon.code)}
                              disabled={couponLoading}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                                isApplied
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-900 text-white hover:bg-slate-800"
                              )}
                            >
                              {isApplied ? 'Bỏ' : 'Dùng'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <PriceLine label="Tạm tính" value={formatVND(subtotal)} />
                <PriceLine
                  label="Phí vận chuyển"
                  value={shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
                  positive={shippingFee === 0}
                />
                {discount > 0 && (
                  <PriceLine label="Giảm giá" value={`-${formatVND(discount)}`} positive />
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Tổng thanh toán</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-primary">
                      {formatVND(total)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                    {shippingFee === 0 ? 'Free ship' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceLine({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-semibold', positive ? 'text-emerald-600' : 'text-slate-800')}>
        {value}
      </span>
    </div>
  )
}

function CheckoutInfoTile({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}
