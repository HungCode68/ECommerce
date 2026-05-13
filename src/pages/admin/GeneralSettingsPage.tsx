import { Settings, ShieldCheck, Store, Truck } from 'lucide-react'

const SETTING_SECTIONS = [
  {
    title: 'Thông tin cửa hàng',
    description: 'Tên cửa hàng, hotline, email, địa chỉ và các thông tin hiển thị ngoài website.',
    icon: Store,
  },
  {
    title: 'Vận chuyển và thanh toán',
    description: 'Phí giao hàng mặc định, phương thức thanh toán, thời gian xử lý đơn.',
    icon: Truck,
  },
  {
    title: 'Bảo mật và phân quyền',
    description: 'Quy tắc đăng nhập, quyền quản trị và các thiết lập an toàn hệ thống.',
    icon: ShieldCheck,
  },
]

export function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Cài đặt hệ thống</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Đây là khu cài đặt chung để mày mở rộng dần về sau. Banner đã được tách riêng sang mục
              {' '}
              <span className="font-semibold text-slate-700">Thiết lập banner</span>
              .
            </p>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Sẵn sàng mở rộng</p>
                <p className="text-xs text-slate-500">Dùng trang này cho các cài đặt chung sau này</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {SETTING_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <article
              key={section.title}
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p>
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Khu này đang để sẵn cho bước phát triển tiếp theo.
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
