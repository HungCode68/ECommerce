import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { adminCategoryApi } from '@/api/admin/adminCategory.api'
import { queryKeys } from '@/lib/queryKeys'

type DeleteCategoryDialogProps = {
  open: boolean
  onClose: () => void
  categoryName?: string
  categoryId?: number
  bulkIds?: number[]
  onSuccess?: () => void
}

export function DeleteCategoryDialog({
  open,
  onClose,
  categoryName,
  categoryId,
  bulkIds,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const qc = useQueryClient()
  const isBulk = bulkIds && bulkIds.length > 0

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (isBulk) {
        return adminCategoryApi.softDelete(bulkIds)
      } else if (categoryId) {
        // Fallback to single hard delete if needed, or soft delete 1 item
        // Currently the prompt says single delete mutation: DELETE /api/admin/categories body: { ids: [id] }
        return adminCategoryApi.softDelete([categoryId])
      }
    },
    onSuccess: () => {
      toast.success(isBulk ? 'Đã xóa các danh mục đã chọn!' : 'Đã xóa danh mục!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.categories.all })
      onSuccess?.()
      onClose()
    },
    onError: () => {
      toast.error('Có lỗi xảy ra, không thể xóa danh mục')
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">
            {isBulk ? `Xóa ${bulkIds.length} danh mục?` : 'Xóa danh mục?'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isBulk
              ? 'Tất cả danh mục đã chọn sẽ bị xóa (xóa mềm).'
              : `Bạn có chắc muốn xóa '${categoryName}'? Hành động này không thể hoàn tác.`}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-error text-white text-sm font-bold shadow-lg shadow-error/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}
