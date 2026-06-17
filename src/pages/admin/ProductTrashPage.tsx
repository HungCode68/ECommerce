import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { queryKeys } from '@/lib/queryKeys'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatVND } from '@/utils/formatters/format'
import { usePagination } from '@/hooks/usePagination'

export function ProductTrashPage() {
  const qc = useQueryClient()
  const { page, limit, totalPages, goToPage } = usePagination()
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.products.deleted({ page, limit }),
    queryFn: () => adminProductApi.getDeleted({ page, limit }),
  })

  const { mutate: hardDeleteAll, isPending: deleting } = useMutation({
    mutationFn: adminProductApi.hardDeleteAll,
    onSuccess: () => {
      toast.success('Đã xóa vĩnh viễn tất cả sản phẩm trong thùng rác!')
      setHardDeleteOpen(false)
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.all })
    },
    onError: () => toast.error('Xóa thất bại'),
  })

  const products = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const pages = totalPages(total)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thùng rác sản phẩm</h1>
          <p className="text-sm text-slate-500">Sản phẩm đã bị xóa mềm ({total})</p>
        </div>
        {products.length > 0 && (
          <button
            onClick={() => setHardDeleteOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Xóa tất cả vĩnh viễn
          </button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : products.length === 0 ? (
        <EmptyState title="Thùng rác trống" description="Không có sản phẩm nào trong thùng rác" />
      ) : (
        <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-slate-100 bg-white shadow-sm w-full">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Danh mục</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Giá</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-50 opacity-70">
                  <td className="px-4 py-3 line-through text-slate-500">{product.name}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {product.categories && product.categories.length > 0
                      ? product.categories[0].name
                      : product.category_name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatVND(product.final_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-3 flex justify-end">
            <Pagination page={page} totalPages={pages} onPageChange={goToPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={hardDeleteOpen}
        onOpenChange={setHardDeleteOpen}
        title="Xóa vĩnh viễn tất cả"
        description="Hành động này không thể hoàn tác. Tất cả sản phẩm trong thùng rác sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={() => hardDeleteAll()}
        loading={deleting}
      />
    </div>
  )
}
