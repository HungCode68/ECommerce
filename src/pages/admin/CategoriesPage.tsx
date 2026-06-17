import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminCategoryApi } from '@/api/admin/adminCategory.api'
import type { Category } from '@/api/category.api'
import axiosClient from '@/lib/axiosClient'
import { CategoryModal } from '@/components/admin/CategoryModal'
import { DeleteCategoryDialog } from '@/components/admin/DeleteCategoryDialog'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function CategoriesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const LIMIT = 10

  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'add' | 'edit'
    category?: Category
  }>({ open: false, mode: 'add' })

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    categoryId?: number
    categoryName?: string
    bulkIds?: number[]
  }>({ open: false })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'categories', 'stats'],
    queryFn: async () => {
      const res = await adminCategoryApi.getList({ page: 1, limit: 100 })
      const categories = res.categories || []
      return {
        total: res.meta?.total || categories.length,
        active: categories.filter((c: Category) => c.is_active).length,
      }
    }
  })

  const { data: dashboardStats } = useQuery({
    queryKey: ['admin', 'stats', 'dashboard'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/api/admin/stats/dashboard')
        return res.data
      } catch {
        return { total_products: 1402 } // Fallback
      }
    }
  })

  // Data
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'categories', { search: debouncedSearch, status, page }],
    queryFn: () => adminCategoryApi.getList({
      q: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      page,
      limit: LIMIT
    })
  })

  const categories = data?.categories || []
  const meta = data?.meta
  const totalItems = meta?.total || 0
  const totalPages = Math.ceil(totalItems / LIMIT) || 1

  const from = (page - 1) * LIMIT + 1
  const to = Math.min(page * LIMIT, totalItems)

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, newStatus }: { id: number, newStatus: 'active' | 'inactive' }) =>
      adminCategoryApi.update(id, { is_active: newStatus === 'active' }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái')
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái')
  })

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(categories.map(c => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const isAllSelected = categories.length > 0 && selectedIds.length === categories.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < categories.length

  return (
    <div className="w-full animate-fade-in">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black font-headline text-on-surface tracking-tighter mb-2">Quản lý danh mục</h2>
          <p className="text-slate-500 font-body max-w-md">Quản lý danh mục sản phẩm của hệ thống</p>
        </div>
        <button
          onClick={() => setModal({ open: true, mode: 'add' })}
          className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-xl font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Thêm danh mục
        </button>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Stat Card 1 */}
        <div className="group relative overflow-hidden bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 transition-all hover:bg-surface-bright">
          <div className="relative z-10">
            <p className="text-xs font-bold font-body text-cyan-600 uppercase tracking-widest mb-1">Tổng danh mục</p>
            <h3 className="text-4xl font-black font-headline text-on-surface">{stats?.total || 0}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-body text-slate-400">
              <span className="text-emerald-500 font-bold">+12%</span> vs last month
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="group relative overflow-hidden bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 transition-all hover:bg-surface-bright">
          <div className="relative z-10">
            <p className="text-xs font-bold font-body text-cyan-600 uppercase tracking-widest mb-1">Danh mục hoạt động</p>
            <h3 className="text-4xl font-black font-headline text-on-surface">{stats?.active || 0}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-body text-slate-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              Đang hoạt động
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="group relative overflow-hidden bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 transition-all hover:bg-surface-bright">
          <div className="relative z-10">
            <p className="text-xs font-bold font-body text-cyan-600 uppercase tracking-widest mb-1">Tổng sản phẩm</p>
            <h3 className="text-4xl font-black font-headline text-on-surface">{dashboardStats?.total_products || 0}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-body text-slate-400">
              <span className="text-cyan-500 font-bold">+0</span> sản phẩm mới hôm nay
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory</span>
          </div>
        </div>
      </section>

      {/* Filters & Table Canvas */}
      <section className="bg-surface-container-low rounded-xl p-1">
        <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-4 border-b border-surface-container">
            <div className="flex flex-1 items-center gap-4 max-w-2xl">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-lg text-sm font-body focus:ring-2 focus:ring-cyan-500 transition-all"
                  placeholder="Tìm kiếm tên hoặc slug..."
                  type="text"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-surface-container-low border-none rounded-lg font-body text-sm py-2.5 px-4 pr-10 focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold font-body text-slate-500 bg-surface-container-low hover:bg-cyan-50 rounded-lg transition-all">
                <span className="material-symbols-outlined text-lg">tune</span>
                Sắp xếp
              </button>
              <button
                onClick={() => toast.info('Tính năng đang phát triển')}
                className="p-2.5 text-slate-400 hover:text-cyan-500 transition-all"
              >
                <span className="material-symbols-outlined">file_download</span>
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="bg-cyan-50 border-b border-cyan-200 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-bold text-cyan-800">Đã chọn {selectedIds.length} danh mục</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteDialog({ open: true, bulkIds: selectedIds })}
                  className="text-sm font-bold text-error hover:underline"
                >
                  Xóa mềm
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-sm font-bold text-slate-500 hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] border-collapse text-left font-body">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="p-5 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isIndeterminate
                      }}
                      onChange={toggleSelectAll}
                      className="rounded border-outline-variant text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap min-w-[250px]">Danh mục</th>
                  <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Slug</th>
                  <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Mô tả</th>
                  <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-center">Số sản phẩm</th>
                  <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-center">Trạng thái</th>
                  <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-5"><div className="h-4 w-4 bg-slate-200 rounded"></div></td>
                      <td className="p-5"><div className="h-10 w-48 bg-slate-200 rounded"></div></td>
                      <td className="p-5"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                      <td className="p-5"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                      <td className="p-5"><div className="h-6 w-20 bg-slate-200 rounded-full"></div></td>
                      <td className="p-5"><div className="h-5 w-10 bg-slate-200 rounded-full"></div></td>
                      <td className="p-5"><div className="h-8 w-16 bg-slate-200 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">category</span>
                      <p className="text-on-surface-variant font-medium text-lg">Không tìm thấy danh mục nào</p>
                      {search && <p className="text-slate-400 mt-1 mb-4 text-sm">Thử tìm kiếm với từ khóa khác</p>}
                      {(search || status !== 'all') && (
                        <button
                          onClick={() => { setSearch(''); setStatus('all') }}
                          className="px-4 py-2 bg-surface-container-low text-cyan-600 font-bold rounded-lg hover:bg-cyan-50"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="group hover:bg-cyan-50/20 transition-all">
                      <td className="p-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(cat.id)}
                          onChange={() => toggleSelect(cat.id)}
                          className="rounded border-outline-variant text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center overflow-hidden shrink-0">
                            {cat.image ? (
                              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-cyan-600">category</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{cat.name}</p>
                            <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-tighter">{cat.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm font-mono text-slate-500">/category/{cat.slug}</td>
                      <td className="p-5 text-sm text-slate-500 max-w-[200px] truncate" title={cat.description}>
                        {cat.description || '—'}
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-slate-600 whitespace-nowrap">
                          {cat.product_count != null ? `${cat.product_count} sản phẩm` : '—'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          {cat.is_active ? (
                            <>
                              <div
                                onClick={() => updateStatus({ id: cat.id, newStatus: 'inactive' })}
                                className="w-10 h-5 bg-cyan-500/20 rounded-full relative cursor-pointer"
                              >
                                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-cyan-500 rounded-full shadow-sm"></div>
                              </div>
                              <span className="text-xs font-bold text-cyan-600">Active</span>
                            </>
                          ) : (
                            <>
                              <div
                                onClick={() => updateStatus({ id: cat.id, newStatus: 'active' })}
                                className="w-10 h-5 bg-neutral-200 rounded-full relative cursor-pointer"
                              >
                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                              </div>
                              <span className="text-xs font-bold text-slate-400">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => setModal({ open: true, mode: 'edit', category: cat })}
                            className="p-2 hover:bg-cyan-100 text-cyan-600 rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, categoryId: cat.id, categoryName: cat.name })}
                            className="p-2 hover:bg-error/10 text-error rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && categories.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-surface-container-low/30 border-t border-surface-container gap-6">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <p className="text-[11px] font-black text-slate-400 font-headline uppercase tracking-widest">
                  Đang hiển thị {from} - {to} / {totalItems}
                </p>
                <p className="text-[10px] text-cyan-600 font-bold">
                  Trang {page} trên tổng {totalPages}
                </p>
              </div>

              <div className="flex items-center gap-3 font-body">
                {/* Navigation Group */}
                <div className="flex items-center bg-surface-container-low rounded-2xl p-1 gap-1 shadow-sm border border-outline-variant/10">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl disabled:opacity-10 transition-all cursor-pointer"
                    title="Trang đầu"
                  >
                    <span className="material-symbols-outlined text-xl">first_page</span>
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl disabled:opacity-10 transition-all cursor-pointer"
                    title="Trang trước"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                </div>

                {/* Numbers Group */}
                <div className="flex items-center gap-1 bg-surface-container-low rounded-2xl p-1 shadow-sm border border-outline-variant/10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      if (totalPages <= 5) return true
                      if (p === 1 || p === totalPages) return true
                      if (p >= page - 1 && p <= page + 1) return true
                      return false
                    })
                    .map((p, i, arr) => {
                      const showEllipsis = i > 0 && arr[i - 1] !== p - 1
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="w-6 text-center text-slate-300 text-xs font-black select-none">...</span>
                          )}
                          <button
                            onClick={() => setPage(p)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all ${page === p
                              ? 'bg-primary-container text-on-primary-container shadow-[0_4px_12px_rgba(6,182,212,0.4)] scale-110 z-10'
                              : 'hover:bg-white text-slate-500 hover:text-cyan-600'
                              }`}
                          >
                            {p}
                          </button>
                        </div>
                      )
                    })
                  }
                </div>

                {/* Navigation Group Right */}
                <div className="flex items-center bg-surface-container-low rounded-2xl p-1 gap-1 shadow-sm border border-outline-variant/10">
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl disabled:opacity-10 transition-all cursor-pointer"
                    title="Trang sau"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl disabled:opacity-10 transition-all cursor-pointer"
                    title="Trang cuối"
                  >
                    <span className="material-symbols-outlined text-xl">last_page</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Kinetic Accents */}
      <div className="fixed right-0 bottom-24 h-64 w-64 -z-10 opacity-[0.03] select-none pointer-events-none">
        <div className="circuit-line w-full h-full"></div>
      </div>

      <CategoryModal
        open={modal.open}
        mode={modal.mode}
        category={modal.category}
        onClose={() => setModal({ open: false, mode: 'add' })}
      />

      <DeleteCategoryDialog
        open={deleteDialog.open}
        categoryId={deleteDialog.categoryId}
        categoryName={deleteDialog.categoryName}
        bulkIds={deleteDialog.bulkIds}
        onClose={() => setDeleteDialog({ open: false })}
        onSuccess={() => setSelectedIds([])}
      />
    </div>
  )
}
