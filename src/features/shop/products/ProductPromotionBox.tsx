import { BadgePercent, RefreshCcw, ShieldCheck, Truck } from 'lucide-react'

const items = [
  {
    icon: Truck,
    title: 'Miễn phí giao hàng',
    description: 'Áp dụng cho đơn từ 500.000đ trong nội thành.',
  },
  {
    icon: ShieldCheck,
    title: 'Bảo hành chính hãng',
    description: 'Cam kết sản phẩm mới, nguyên seal và bảo hành đầy đủ.',
  },
  {
    icon: RefreshCcw,
    title: 'Đổi trả dễ dàng',
    description: 'Hỗ trợ đổi trả theo chính sách hiện hành của TechZone.',
  },
  {
    icon: BadgePercent,
    title: 'Ưu đãi thêm',
    description: 'Giảm thêm khi thanh toán online hoặc mua kèm phụ kiện.',
  },
]

export function ProductPromotionBox() {
  return (
    <div className="rounded-2xl border border-[#ccc3d8] bg-white p-5">
      <h3 className="mb-4 text-lg font-semibold text-[#1c1b1b]">Ưu đãi & cam kết</h3>
      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#630ed4]/10 text-[#630ed4]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1c1b1b]">{item.title}</p>
                <p className="text-sm text-[#4a4455]">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
