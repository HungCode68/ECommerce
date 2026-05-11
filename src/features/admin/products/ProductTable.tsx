import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, RotateCcw, Search, Upload, Package2 } from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { categoryApi } from '@/api/category.api'
import { queryKeys } from '@/lib/queryKeys'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SearchInput } from '@/components/shared/SearchInput'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatVND } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { usePagination } from '@/hooks/usePagination'
import { BulkAddDialog } from './BulkAddDialog'
import type { Product } from '@/types/product.types'

export function ProductTable() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, totalPages, goToPage } = usePagination()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined)
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [bulkAddOpen, setBulkAddOpen] = useState(false)

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoryApi.getAll,
  })


  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.products.list({ q: search, page, limit, category_id: selectedCategoryId, brand: selectedBrand }),
    queryFn: () =>
      search || selectedCategoryId || selectedBrand
        ? adminProductApi.search({ q: search, page, limit, category_id: selectedCategoryId, brand: selectedBrand })
        : adminProductApi.getAllPaged({ page, limit }),
  })

  const { mutate: softDelete, isPending: deleting } = useMutation({
    mutationFn: () => adminProductApi.softDelete(selectedIds),
    onSuccess: () => {
      toast.success(`Đã xóa ${selectedIds.length} sản phẩm`)
      setSelectedIds([])
      setDeleteOpen(false)
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.all })
    },
    onError: () => toast.error('Xóa thất bại'),
  })

  const products = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const pages = totalPages(total)

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.length === products.length ? [] : products.map((p) => p.id),
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          onSearch={(v) => { setSearch(v); goToPage(1) }}
          placeholder="Tìm sản phẩm..."
          className="w-64"
        />
        <select
          value={selectedCategoryId ?? ''}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined
            setSelectedCategoryId(val)
            goToPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">Tất cả danh mục</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={selectedBrand ?? ''}
          onChange={(e) => {
            const val = e.target.value || undefined
            setSelectedBrand(val)
            goToPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">Tất cả thương hiệu</option>
          {/* Extract unique brands from the current data if available, or just show the selected one */}
          {Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort().map(brand => (
            <option key={brand} value={brand!}>{brand}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Xóa ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => navigate(ROUTES.ADMIN_PRODUCT_TRASH)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Thùng rác
          </button>
          <button
            onClick={() => setBulkAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Nhập CSV
          </button>
          <button
            onClick={() => navigate(ROUTES.ADMIN_PRODUCT_CREATE)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Không có sản phẩm"
          description="Chưa có sản phẩm nào. Thêm sản phẩm mới để bắt đầu."
          icon={<Search className="h-8 w-8" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                  />
                </th>
                 <th className="px-4 py-3 text-left font-medium text-slate-600">Ảnh</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tên sản phẩm</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Giá</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Kho</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: Product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  selected={selectedIds.includes(product.id)}
                  onToggle={() => toggleSelect(product.id)}
                  onEdit={() => navigate(ROUTES.ADMIN_PRODUCT_EDIT(product.id))}
                />
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {total} sản phẩm
            </p>
            <Pagination page={page} totalPages={pages} onPageChange={goToPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa sản phẩm"
        description={`Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm? Chúng sẽ được chuyển vào thùng rác.`}
        onConfirm={() => softDelete()}
        loading={deleting}
      />

      <BulkAddDialog 
        open={bulkAddOpen}
        onOpenChange={setBulkAddOpen}
      />
    </div>
  )
}

function ProductRow({
  product,
  selected,
  onToggle,
  onEdit,
}: {
  product: Product
  selected: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  return (
    <tr className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected ? 'bg-blue-50' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="rounded border-slate-300"
        />
      </td>
      <td className="px-4 py-3">
        <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="h-full w-full object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.src = 'https://placehold.co/100x100?text=No+Image'
                img.onerror = null
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Package2 className="h-5 w-5" />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-800 line-clamp-1">{product.name}</p>
          <p className="text-xs text-slate-400">{product.slug}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-medium text-slate-900">
        {product.min_price ? formatVND(product.min_price) : '0đ'}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-mono text-sm ${product.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>
          {product.stock}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Sửa
        </button>
      </td>
    </tr>
  )
}
