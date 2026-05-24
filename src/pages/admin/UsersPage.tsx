import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Pencil, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { adminUserApi, type AdminUser, type AdminUserStatus } from '@/api/admin/adminUser.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { usePagination } from '@/hooks/usePagination'
import { queryKeys } from '@/lib/queryKeys'
import { formatDate, formatDateTime } from '@/utils/formatters/format'

type UserStatusFilter = AdminUserStatus | 'all'

const USER_STATUS_FILTER_OPTIONS: Array<{
  value: UserStatusFilter
  label: string
}> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'offline', label: 'Đã offline' },
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
  const [blockReason, setBlockReason] = useState('')
  const [editReasonOpen, setEditReasonOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editingReason, setEditingReason] = useState('')

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
    mutationFn: ({ ids, reason }: { ids: number[]; reason: string }) =>
      adminUserApi.blockMany(ids, reason),
    onSuccess: (_data, variables) => {
      toast.success(`Đã chặn ${variables.ids.length} người dùng`)
      setSelectedIds([])
      setBlockOpen(false)
      setBlockReason('')
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Chặn thất bại'),
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

  const { mutate: updateBlockedReason, isPending: updatingBlockedReason } = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminUserApi.update(id, { blocked_reason: reason }),
    onSuccess: () => {
      toast.success('Đã cập nhật lý do bị chặn')
      setEditReasonOpen(false)
      setEditingUser(null)
      setEditingReason('')
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Cập nhật lý do thất bại'),
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

  const openEditReasonDialog = (user: AdminUser) => {
    setEditingUser(user)
    setEditingReason(user.blocked_reason ?? '')
    setEditReasonOpen(true)
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
                  Đăng nhập cuối
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Lý do bị chặn
                </th>
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
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateTime(user.last_active_at ?? undefined)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {user.status === 'blocked' ? user.blocked_reason || 'Không có lý do' : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      {user.status === 'blocked' && !selectedIds.includes(user.id) ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditReasonDialog(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa lý do
                          </button>
                          <button
                            type="button"
                            onClick={() => restoreOne(user.id)}
                            disabled={restoring}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Bỏ chặn
                          </button>
                        </div>
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

      <AlertDialog
        open={blockOpen}
        onOpenChange={(open) => {
          setBlockOpen(open)
          if (!open) {
            setBlockReason('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chặn người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              {`Chặn ${selectedActiveIds.length} người dùng đã chọn? Người dùng bị chặn sẽ không đăng nhập được.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="block-reason">
              Lý do bị chặn
            </label>
            <textarea
              id="block-reason"
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="Nhập lý do bị chặn"
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                const reason = blockReason.trim()
                if (!reason) {
                  event.preventDefault()
                  toast.error('Vui lòng nhập lý do bị chặn')
                  return
                }
                blockMany({ ids: selectedActiveIds, reason })
              }}
              disabled={blocking}
            >
              {blocking ? 'Đang xử lý...' : 'Chặn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={editReasonOpen}
        onOpenChange={(open) => {
          setEditReasonOpen(open)
          if (!open) {
            setEditingUser(null)
            setEditingReason('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sửa lý do bị chặn</AlertDialogTitle>
            <AlertDialogDescription>
              {editingUser
                ? `Cập nhật lý do bị chặn cho tài khoản ${editingUser.username}.`
                : 'Cập nhật lý do bị chặn cho tài khoản.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="edit-block-reason">
              Lý do bị chặn
            </label>
            <textarea
              id="edit-block-reason"
              value={editingReason}
              onChange={(event) => setEditingReason(event.target.value)}
              placeholder="Nhập lý do bị chặn"
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingBlockedReason}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                const reason = editingReason.trim()
                if (!editingUser) {
                  event.preventDefault()
                  return
                }
                if (!reason) {
                  event.preventDefault()
                  toast.error('Vui lòng nhập lý do bị chặn')
                  return
                }
                updateBlockedReason({ id: editingUser.id, reason })
              }}
              disabled={updatingBlockedReason}
            >
              {updatingBlockedReason ? 'Đang xử lý...' : 'Lưu'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
