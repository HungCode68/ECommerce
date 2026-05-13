import { Loader2, TicketPercent } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatVND } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'

type CartSummaryProps = {
  couponCode: string
  onCouponCodeChange: (value: string) => void
  onApplyCoupon: () => void
  couponLoading?: boolean
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  onCheckout: () => void
  checkoutDisabled?: boolean
}

export function CartSummary({
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  couponLoading,
  subtotal,
  shippingFee,
  discount,
  total,
  onCheckout,
  checkoutDisabled,
}: CartSummaryProps) {
  return (
    <div className="space-y-4 lg:sticky lg:top-28">
      <section className="rounded-xl border border-[#ccc3d8] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#1c1b1b]">Tóm tắt đơn hàng</h2>

        <div className="mt-5 flex gap-2">
          <input
            value={couponCode}
            onChange={(event) => onCouponCodeChange(event.target.value)}
            placeholder="Nhập mã giảm giá"
            className="min-w-0 flex-1 rounded-lg border border-[#ccc3d8] px-4 py-2 text-sm outline-none transition focus:border-[#630ed4] focus:ring-1 focus:ring-[#630ed4]"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            disabled={couponLoading || subtotal <= 0}
            className="rounded-lg bg-[#e8ddff] px-4 py-2 text-sm font-semibold text-[#3f1e8c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#7b7487]">Mã giảm giá sẽ được xác nhận lại ở bước thanh toán.</p>

        <div className="mt-6 space-y-3 border-b border-[#e5e2e1] pb-4 text-sm">
          <SummaryLine label="Tạm tính" value={formatVND(subtotal)} />
          <SummaryLine
            label="Phí vận chuyển"
            value={shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
            valueClassName={shippingFee === 0 ? 'font-bold text-green-600' : undefined}
          />
          <SummaryLine
            label="Giảm giá"
            value={`-${formatVND(discount)}`}
            valueClassName="font-bold text-[#ba1a1a]"
          />
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-[#1c1b1b]">Tổng cộng</p>
              <p className="text-xs italic text-[#7b7487]">(Đã bao gồm VAT)</p>
            </div>
            <span className="text-2xl font-bold text-[#630ed4]">{formatVND(total)}</span>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            disabled={checkoutDisabled}
            className="w-full rounded-xl bg-[#630ed4] py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tiến hành đặt hàng
          </button>

          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#630ed4] hover:underline"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </section>

      <section className="flex items-center gap-3 rounded-xl border border-[#630ed4]/20 bg-[#7c3aed]/5 p-4">
        <TicketPercent className="h-5 w-5 text-[#630ed4]" />
        <div className="text-sm">
          <p className="font-semibold text-[#630ed4]">Cần hỗ trợ?</p>
          <p className="text-[#4a4455]">
            Gọi ngay: <span className="font-semibold text-[#630ed4]">1900 1234</span>
          </p>
        </div>
      </section>
    </div>
  )
}

function SummaryLine({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#4a4455]">{label}</span>
      <span className={valueClassName ?? 'font-bold text-[#1c1b1b]'}>{value}</span>
    </div>
  )
}
