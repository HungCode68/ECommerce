import { Settings } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cài đặt</h1>
        <p className="text-sm text-slate-500">Thiết lập hệ thống quản trị</p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <EmptyState
          title="Chưa có trang cài đặt"
          description="Module cài đặt chưa được triển khai trong bản hiện tại."
          icon={<Settings className="h-8 w-8" />}
        />
      </div>
    </div>
  )
}
