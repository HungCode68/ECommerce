import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, CheckCircle, Clock, Trash2, ShieldAlert, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { callbackApi } from '@/api/callback.api'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export function CallbackRequestsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Fetch callback requests
  const { data, isLoading } = useQuery({
    queryKey: ['callback-requests', statusFilter, page],
    queryFn: () => callbackApi.getAll({ status: statusFilter, page, page_size: pageSize }),
  })

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'completed' | 'cancelled' }) =>
      callbackApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callback-requests'] })
      toast.success('Cập nhật trạng thái thành công!')
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật trạng thái.')
    },
  })

  // Delete request mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => callbackApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callback-requests'] })
      toast.success('Xóa yêu cầu thành công!')
    },
    onError: () => {
      toast.error('Lỗi khi xóa yêu cầu.')
    },
  })

  const handleStatusChange = (id: number, status: 'pending' | 'completed' | 'cancelled') => {
    updateStatusMutation.mutate({ id, status })
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa yêu cầu gọi lại này không?')) {
      deleteMutation.mutate(id)
    }
  }

  const list = data?.list || []
  const total = data?.meta?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Yêu cầu gọi lại</h1>
          <p className="text-sm text-slate-500">
            Xem và xử lý các số điện thoại do khách hàng để lại yêu cầu hỗ trợ.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { key: '', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ xử lý' },
          { key: 'completed', label: 'Đã liên hệ' },
          { key: 'cancelled', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key)
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-[6px] ${
              statusFilter === tab.key
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <Phone size={48} className="stroke-[1.5] mb-2" />
            <p className="text-sm">Không có yêu cầu gọi lại nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày yêu cầu</th>
                  <th className="px-6 py-4">Cập nhật lúc</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <Phone size={16} className="text-slate-400" />
                        {item.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[250px]">
                      <p className="truncate text-slate-600" title={item.reason || 'Không có'}>
                        {item.reason || <span className="text-slate-400 italic">Không có</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-800 border border-yellow-100">
                          <Clock size={12} />
                          Chờ xử lý
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 border border-green-100">
                          <CheckCircle size={12} />
                          Đã liên hệ
                        </span>
                      )}
                      {item.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                          <XCircle size={12} />
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.created_at
                        ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                        : '---'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.updated_at
                        ? format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                        : '---'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'completed')}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-white hover:bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors"
                            >
                              Đã liên hệ
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'cancelled')}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors"
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {item.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'pending')}
                            className="inline-flex items-center gap-1 rounded-lg border border-yellow-200 bg-white hover:bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 transition-colors"
                          >
                            Đánh dấu chưa gọi
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors"
                          title="Xóa yêu cầu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="font-semibold text-slate-700">{list.length}</span> trên{' '}
              <span className="font-semibold text-slate-700">{total}</span> yêu cầu
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="inline-flex items-center text-xs font-semibold text-slate-700 px-2">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
