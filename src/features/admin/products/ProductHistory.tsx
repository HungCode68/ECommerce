import { useQuery } from '@tanstack/react-query'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { queryKeys } from '@/lib/queryKeys'
import { formatDateTime } from '@/utils/formatters/format'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { History } from 'lucide-react'
import type { ProductHistory, ProductHistoryGroup } from '@/types/product.types'

type ProductHistoryProps = {
  productId?: number
}

export function ProductHistory({ productId }: ProductHistoryProps) {
  const isValidProductId = typeof productId === 'number' && Number.isFinite(productId)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.products.history(productId),
    queryFn: () => adminProductApi.getHistory(productId),
    enabled: isValidProductId,
  })

  if (!isValidProductId) {
    return null
  }

  if (isLoading) return <TableSkeleton rows={4} cols={3} />

  const rows = flattenHistoryGroups(data)

  if (!rows.length) {
    return (
      <EmptyState
        title="Chưa có lịch sử"
        description="Chưa có thao tác nào được ghi lại"
        icon={<History className="h-8 w-8" />}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Thao tác</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Người thực hiện</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Chi tiết</th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {item.message ?? 'Cập nhật'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">
                {typeof item.admin_id === 'number' ? `Admin #${item.admin_id}` : 'Hệ thống'}
              </td>
              <td className="max-w-xs px-4 py-3 text-slate-500">
                <div className="truncate">
                  {formatHistoryDetails(item.note, item.changes)}
                </div>
              </td>
              <td className="px-4 py-3 text-right text-slate-400 text-xs">
                {formatDateTime(item.changed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function flattenHistoryGroups(groups?: ProductHistoryGroup[]) {
  return groups?.flatMap((group) =>
    group.histories.map((history) => ({
      ...history,
      message: group.message,
    })),
  ) ?? []
}

function formatHistoryDetails(note: string | null | undefined, changes: ProductHistory['changes']) {
  const trimmedNote = note?.trim()
  if (trimmedNote) {
    return trimmedNote
  }

  if (changes == null) {
    return '-'
  }

  if (typeof changes === 'string') {
    return changes.trim() || '-'
  }

  try {
    const serialized = JSON.stringify(changes)
    return serialized && serialized !== '{}' ? serialized : '-'
  } catch {
    return '-'
  }
}
