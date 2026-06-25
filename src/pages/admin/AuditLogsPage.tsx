import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAuditApi } from '@/api/admin/adminAudit.api'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePagination } from '@/hooks/usePagination'
import { formatDateTime } from '@/utils/formatters/format'
import { ShieldAlert, Database, ArrowRight } from 'lucide-react'

const formatValue = (val: any): string => {
  if (val === null || val === undefined) return 'Trống'
  
  if (Array.isArray(val)) {
    if (val.length === 0) return 'Trống'
    return val.map(v => formatValue(v)).join(' | ')
  }
  
  if (typeof val === 'object') {
    if (val.name) return String(val.name)
    if (val.title) return String(val.title)
    if (val.code) return String(val.code)
    
    if (val.id && Object.keys(val).length === 1) return `ID: ${val.id}`

    try {
      return JSON.stringify(val)
    } catch {
      return 'Dữ liệu phức tạp'
    }
  }
  
  if (typeof val === 'boolean') {
    return val ? 'Có (True)' : 'Không (False)'
  }

  if (typeof val === 'string') {
    if (val === '') return 'Trống'
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      try {
        return new Date(val).toLocaleString('vi-VN')
      } catch {
        return val
      }
    }
  }

  return String(val)
}

export function AuditLogsPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { page, limit, totalPages, goToPage } = usePagination(1, 20)
  const [entityType, setEntityType] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin.auditLogs', { page, limit, entityType, actionFilter }],
    queryFn: () => adminAuditApi.getList({ page, limit, entity_type: entityType, action: actionFilter }),
  })

  const logs = logsData?.data ?? []
  const total = logsData?.pagination.total ?? 0
  const pages = totalPages(total)

  const renderChanges = (oldVal: string, newVal: string) => {
    try {
      if (oldVal === '{}' && newVal === '{}') return <span className="text-slate-400">Không có chi tiết</span>
      
      const oldObj = JSON.parse(oldVal)
      const newObj = JSON.parse(newVal)
      
      return (
        <div className="flex flex-col gap-1 text-xs">
          {Object.keys(newObj).map((key) => (
            <div key={key} className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-700">{key}:</span>
              {oldObj[key] !== undefined && (
                <span className="text-rose-600 line-through truncate max-w-[200px]" title={formatValue(oldObj[key])}>
                  {formatValue(oldObj[key])}
                </span>
              )}
              {oldObj[key] !== undefined && <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />}
              <span className="text-emerald-600 font-medium truncate max-w-[200px]" title={formatValue(newObj[key])}>
                {formatValue(newObj[key])}
              </span>
            </div>
          ))}
        </div>
      )
    } catch (e) {
      // Fallback if not JSON (e.g. plain string)
      return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {oldVal && oldVal !== 'null' && <span className="text-rose-600 line-through truncate max-w-[150px]">{oldVal}</span>}
          {oldVal && oldVal !== 'null' && <ArrowRight className="h-3 w-3 text-slate-400" />}
          <span className="text-emerald-600 truncate max-w-[150px]">{newVal}</span>
        </div>
      )
    }
  }

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold">CREATE</span>
      case 'UPDATE': return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold">UPDATE</span>
      case 'DELETE': return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[11px] font-bold">DELETE</span>
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">{action}</span>
    }
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Nhật ký hoạt động</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Lưu trữ mọi thao tác thay đổi dữ liệu của toàn bộ quản trị viên trên hệ thống. 
                Giúp truy vết ai đã thay đổi thông tin gì vào lúc nào.
              </p>
            </div>
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <ShieldAlert className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Tính năng bảo mật</p>
                  <p className="text-xs text-slate-500">Lịch sử được lưu trữ vĩnh viễn và không thể xoá.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value)
            goToPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300"
        >
          <option value="">Tất cả Module</option>
          <option value="SETTING">Cài đặt (SETTING)</option>
          <option value="USER">Người dùng (USER)</option>
          <option value="PRODUCT">Sản phẩm (PRODUCT)</option>
          <option value="ORDER">Đơn hàng (ORDER)</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            goToPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300"
        >
          <option value="">Tất cả Hành động</option>
          <option value="CREATE">Tạo mới (CREATE)</option>
          <option value="UPDATE">Cập nhật (UPDATE)</option>
          <option value="DELETE">Xóa (DELETE)</option>
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Chưa có lịch sử nào"
          description="Chưa có hành động thay đổi nào được ghi nhận với bộ lọc hiện tại."
          icon={<Database className="h-8 w-8" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Thời gian</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Người thực hiện</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Hành động</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Mục / ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{log.admin_name || 'Admin'}</div>
                      <div className="text-[11px] text-slate-500">ID: {log.admin_id}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{log.entity_type}</div>
                      {log.entity_id && <div className="text-[11px] text-slate-400">ID: {log.entity_id}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-md p-2 w-full min-w-[250px]">
                        {renderChanges(log.old_values, log.new_values)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex justify-end border-t border-slate-100 px-4 py-3">
              <Pagination page={page} totalPages={pages} onPageChange={goToPage} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
