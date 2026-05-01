import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { adminUserApi, type AdminUser, type AdminUserStatus } from '@/api/admin/adminUser.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { usePagination } from '@/hooks/usePagination'
import { queryKeys } from '@/lib/queryKeys'
import { formatDate } from '@/utils/formatters/format'

type UserStatusFilter = AdminUserStatus | 'all'

const USER_STATUS_FILTER_OPTIONS: Array<{
  value: UserStatusFilter
  label: string
}> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'offline', label: 'Đã offline' },
  { value: 'inactive', label: 'Chưa hoạt động' },
  { value: 'blocked', label: 'Đã chặn' },
]

const USER_STATUS_META: Record<
  AdminUserStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Đang hoạt động',
    className: 'bg-emerald-100 text-emerald-700',
  },
  offline: {
    label: 'Đã offline',
    className: 'bg-cyan-100 text-cyan-700',
  },
  inactive: {
    label: 'Chưa hoạt động',
    className: 'bg-amber-100 text-amber-700',
  },
  blocked: {
    label: 'Đã chặn',
    className: 'bg-red-100 text-red-700',
  },
}

export function UsersPage() {
  const qc = useQueryClient()
  const { page, limit, totalPages, goToPage } = usePagination()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [blockOpen, setBlockOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: queryKeys.admin.users.list({ page, limit }),
    queryFn: () => adminUserApi.getList({ page, limit }),
    enabled: !search,
  })

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: queryKeys.admin.users.list({ q: search }),
    queryFn: () => adminUserApi.search(search),
    enabled: !!search,
  })

  const { mutate: blockMany, isPending: blocking } = useMutation({
    mutationFn: (ids: number[]) => adminUserApi.blockMany(ids),
    onSuccess: (_data, ids) => {
      toast.success(`Đã chặn ${ids.length} người dùng`)
      setSelectedIds([])
      setBlockOpen(false)
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
    },
    onError: () => toast.error('Chặn thất bại'),
  })

  const { mutate: restoreOne, isPending: restoring } = useMutation({
    mutationFn: (id: number) => adminUserApi.restoreOne(id),
    onSuccess: () => {
      toast.success('Đã bỏ chặn người dùng')
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
    },
    onError: () => toast.error('Bỏ chặn thất bại'),
  })

  const { mutate: restoreMany, isPending: restoringMany } = useMutation({
    mutationFn: (ids: number[]) => adminUserApi.restoreMany(ids),
    onSuccess: (_data, ids) => {
      toast.success(`Đã bỏ chặn ${ids.length} người dùng`)
      setSelectedIds([])
      setRestoreOpen(false)
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
    },
    onError: () => toast.error('Bỏ chặn thất bại'),
  })

  const baseUsers: AdminUser[] = search ? (searchResults ?? []) : (listData?.data ?? [])
  const customerUsers = baseUsers.filter((user) => user.role === 'user')
  const filteredUsers = customerUsers.filter(
    (user) => statusFilter === 'all' || user.status === statusFilter,
  )
  const selectedUsers = filteredUsers.filter((user) => selectedIds.includes(user.id))
  const selectedBlockedIds = selectedUsers
    .filter((user) => user.status === 'blocked')
    .map((user) => user.id)
  const selectedActiveIds = selectedUsers
    .filter((user) => user.status !== 'blocked')
    .map((user) => user.id)
  const total = filteredUsers.length
  const pages = totalPages(total)
  const currentPage = search ? 1 : pages > 0 ? Math.min(page, pages) : 1
  const visibleUsers = search
    ? filteredUsers
    : filteredUsers.slice((currentPage - 1) * limit, currentPage * limit)
  const isLoading = search ? searchLoading : listLoading

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )

  const toggleAll = () => {
    const visibleIds = visibleUsers.map((user) => user.id)
    const allVisibleSelected =
      visibleUsers.length > 0 &&
      visibleUsers.every((user) => selectedIds.includes(user.id))

    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const visibleIdSet = new Set(visibleIds)
        return prev.filter((id) => !visibleIdSet.has(id))
      }

      const merged = new Set(prev)
      visibleIds.forEach((id) => merged.add(id))
      return Array.from(merged)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Người dùng</h1>
        <p className="text-sm text-slate-500">{total} tài khoản</p>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          onSearch={(value) => {
            setSearch(value)
            setSelectedIds([])
            goToPage(1)
          }}
          placeholder="Tìm người dùng..."
          className="w-64"
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as UserStatusFilter)
            setSelectedIds([])
            goToPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300"
        >
          {USER_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(selectedBlockedIds.length > 0 || selectedActiveIds.length > 0) && (
          <div className="flex items-center gap-2">
            {selectedBlockedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setRestoreOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
              >
                <RotateCcw className="h-4 w-4" />
                Bỏ chặn ({selectedBlockedIds.length})
              </button>
            )}
            {selectedActiveIds.length > 0 && (
              <button
                type="button"
                onClick={() => setBlockOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100"
              >
                <Ban className="h-4 w-4" />
                Chặn ({selectedActiveIds.length})
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : visibleUsers.length === 0 ? (
        <EmptyState
          title="Không tìm thấy"
          description="Không có người dùng nào khớp với bộ lọc hiện tại"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      visibleUsers.length > 0 &&
                      visibleUsers.every((user) => selectedIds.includes(user.id))
                    }
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tên</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Vai trò</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Ngày tham gia
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const statusMeta = USER_STATUS_META[user.status]
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-slate-50 hover:bg-slate-50 ${
                      selectedIds.includes(user.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      {user.status === 'blocked' && !selectedIds.includes(user.id) ? (
                        <button
                          type="button"
                          onClick={() => restoreOne(user.id)}
                          disabled={restoring}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Bỏ chặn
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!search && (
            <div className="flex justify-end border-t border-slate-100 px-4 py-3">
              <Pagination page={currentPage} totalPages={pages} onPageChange={goToPage} />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title="Chặn người dùng"
        description={`Chặn ${selectedActiveIds.length} người dùng đã chọn? Người dùng bị chặn sẽ không đăng nhập được.`}
        onConfirm={() => blockMany(selectedActiveIds)}
        confirmLabel="Chặn"
        loading={blocking}
      />

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Bỏ chặn người dùng"
        description={`Bỏ chặn ${selectedBlockedIds.length} người dùng đã chọn? Các tài khoản này sẽ đăng nhập lại được.`}
        onConfirm={() => restoreMany(selectedBlockedIds)}
        confirmLabel="Bỏ chặn"
        loading={restoringMany}
      />
    </div>
  )
}
