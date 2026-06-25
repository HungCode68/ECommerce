import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Store, Truck, ShieldCheck, Save, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { settingApi } from '@/api/setting.api'
import { adminUserApi } from '@/api/admin/adminUser.api'
import { queryKeys } from '@/lib/queryKeys'
import { AuditLogsPage } from './AuditLogsPage'
import { cn } from '@/lib/utils'

export function GeneralSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'general' | 'audit'>('general')
  const [zaloLink, setZaloLink] = useState('')
  const [hotline, setHotline] = useState('')

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: settingApi.getSettings,
  })

  // Sync settings response to local state
  useEffect(() => {
    if (settings) {
      setZaloLink(settings.zalo_link)
      setHotline(settings.hotline)
    }
  }, [settings])

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: settingApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast.success('Cập nhật cài đặt hệ thống thành công!')
    },
    onError: () => {
      toast.error('Lỗi khi lưu cài đặt.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!zaloLink.trim() || !hotline.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin cài đặt.')
      return
    }
    updateSettingsMutation.mutate({
      zalo_link: zaloLink.trim(),
      hotline: hotline.trim(),
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Cài đặt hệ thống</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Quản lý cấu hình chung cho toàn bộ cửa hàng, bao gồm các kênh hỗ trợ khách hàng và các dịch vụ đi kèm.
            </p>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <Settings className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Cấu hình linh hoạt</p>
                <p className="text-xs text-slate-500">Cài đặt ở đây sẽ cập nhật ngay lập tức ra website khách hàng.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            "pb-3 font-semibold text-sm border-b-2 transition-all",
            activeTab === 'general' ? "border-cyan-600 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Cài đặt chung & Phân quyền
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={cn(
            "pb-3 font-semibold text-sm border-b-2 transition-all",
            activeTab === 'audit' ? "border-cyan-600 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Nhật ký hoạt động
        </button>
      </div>

      {activeTab === 'general' ? (
        isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
          </div>
        ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Settings Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Store className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Thông tin hỗ trợ khách hàng</h2>
                  <p className="text-xs text-slate-500">Cấu hình các nút liên kết trực tiếp trên tiện ích hỗ trợ (floating widget).</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Zalo link field */}
                <div>
                  <label htmlFor="zalo_link" className="block text-sm font-bold text-slate-700 mb-1.5">
                    Link Zalo Chat (Zalo.me)
                  </label>
                  <input
                    type="url"
                    id="zalo_link"
                    required
                    value={zaloLink}
                    onChange={(e) => setZaloLink(e.target.value)}
                    placeholder="Ví dụ: https://zalo.me/0987654321"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">Đường dẫn đầy đủ dẫn tới Zalo cá nhân hoặc OA của shop.</p>
                </div>

                {/* Hotline field */}
                <div>
                  <label htmlFor="hotline" className="block text-sm font-bold text-slate-700 mb-1.5">
                    Số Hotline (Gọi trực tiếp)
                  </label>
                  <input
                    type="text"
                    id="hotline"
                    required
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    placeholder="Ví dụ: 19006680 hoặc 0987654321"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">Số điện thoại hiển thị cho cuộc gọi hỗ trợ trực tiếp.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 font-semibold text-white text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Lưu cài đặt
                </button>
              </div>
            </div>
          </form>

          {/* Placeholders Sections */}
          <div className="space-y-6">
            {/* Shipping section placeholder */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm opacity-85">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                <Truck className="h-5 w-5" />
              </div>
              <h2 className="text-md font-bold text-slate-800">Vận chuyển và thanh toán</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Phí giao hàng mặc định, phương thức thanh toán, thời gian xử lý đơn.
              </p>
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Khu vực đang phát triển.
              </div>
            </div>

            {/* Create Admin Form */}
            <CreateAdminForm />
          </div>
        </div>
        )
      ) : (
        <AuditLogsPage hideHeader={true} />
      )}
    </div>
  )
}

function CreateAdminForm() {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminUserApi.create>[0]) => adminUserApi.create(data),
    onSuccess: () => {
      toast.success('Đã tạo tài khoản Quản trị viên mới!')
      setUsername('')
      setEmail('')
      setPassword('')
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo admin')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    createMutation.mutate({ username: username.trim(), email: email.trim(), password })
  }

  return (
    <form onSubmit={handleCreate} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h2 className="text-md font-bold text-slate-800">Bảo mật và phân quyền</h2>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Cấp quyền quản trị viên cho một tài khoản mới. Người này sẽ có toàn quyền truy cập trang quản trị.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ví dụ: admin_thu2"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ít nhất 6 ký tự"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 font-semibold text-white text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          Tạo tài khoản Admin
        </button>
      </div>
    </form>
  )
}
