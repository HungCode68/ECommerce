import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { adminCouponApi } from '@/api/admin/adminCoupon.api'
import { queryKeys } from '@/lib/queryKeys'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePagination } from '@/hooks/usePagination'
import { formatVND, formatDate } from '@/utils/formatters/format'
import { cn } from '@/lib/utils'

const couponSchema = z.object({
  code: z.string().min(3, 'Mã tối thiểu 3 ký tự').toUpperCase(),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().min(1),
  min_order_amount: z.coerce.number().min(0),
  max_usage: z.coerce.number().min(1),
  max_usage_per_user: z.coerce.number().min(1),
  expired_at: z.string().min(1, 'Chọn ngày hết hạn'),
})

type CouponFormData = z.infer<typeof couponSchema>

export function CouponsPage() {
  const qc = useQueryClient()
  const { page, limit, totalPages, goToPage } = usePagination()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.coupons.list({ page, limit }),
    queryFn: () => adminCouponApi.getList({ page, limit }),
  })

  const { mutate: deleteOne, isPending: deleting } = useMutation({
    mutationFn: (id: number) => adminCouponApi.deleteOne(id),
    onSuccess: () => {
      toast.success('Đã xóa mã giảm giá!')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons.all })
    },
  })

  const coupons = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mã giảm giá</h1>
          <p className="text-sm text-slate-500">{total} mã</p>
        </div>
        <button
          onClick={() => { setEditId(null); setShowForm(true) }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />Tạo mã
        </button>
      </div>

      {showForm && (
        <CouponForm couponId={editId ?? undefined} onClose={() => { setShowForm(false); setEditId(null) }} />
      )}

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : coupons.length === 0 ? (
        <EmptyState title="Chưa có mã giảm giá" description="Tạo mã giảm giá để khuyến khích khách hàng mua sắm" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Mã</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Loại</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Giá trị</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Đã dùng</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Hết hạn</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{coupon.code}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', coupon.type === 'percent' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                      {coupon.type === 'percent' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {coupon.type === 'percent' ? `${coupon.value}%` : formatVND(coupon.value)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{coupon.used_count}/{coupon.max_usage}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(coupon.expired_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setEditId(coupon.id); setShowForm(true) }} className="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(coupon.id)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-3 flex justify-end">
            <Pagination page={page} totalPages={totalPages(total)} onPageChange={goToPage} />
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Xóa mã giảm giá" description="Bạn có chắc muốn xóa mã này?" onConfirm={() => deleteId && deleteOne(deleteId)} loading={deleting} />
    </div>
  )
}

function CouponForm({ couponId, onClose }: { couponId?: number; onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: 'percent', max_usage_per_user: 1 },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CouponFormData) =>
      couponId ? adminCouponApi.update(couponId, data) : adminCouponApi.create(data),
    onSuccess: () => {
      toast.success(couponId ? 'Cập nhật thành công!' : 'Tạo mã thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons.all })
      onClose()
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const type = watch('type')

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
      <h3 className="mb-4 font-semibold text-slate-800">{couponId ? 'Sửa mã' : 'Tạo mã giảm giá'}</h3>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: 'code', label: 'Mã code *', placeholder: 'SUMMER20' },
          { name: 'value', label: type === 'percent' ? 'Giá trị (%) *' : 'Giá trị (₫) *', placeholder: '20', type: 'number' },
          { name: 'min_order_amount', label: 'Đơn tối thiểu (₫)', placeholder: '200000', type: 'number' },
          { name: 'max_usage', label: 'Số lần dùng tối đa *', placeholder: '100', type: 'number' },
          { name: 'max_usage_per_user', label: 'Mỗi user *', placeholder: '1', type: 'number' },
          { name: 'expired_at', label: 'Ngày hết hạn *', type: 'datetime-local' },
        ].map((f) => (
          <div key={f.name}>
            <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
            <input
              {...register(f.name as keyof CouponFormData)}
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              className={cn('w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2', errors[f.name as keyof CouponFormData] ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200')}
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Loại *</label>
          <select {...register('type')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="percent">Phần trăm (%)</option>
            <option value="fixed">Cố định (₫)</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Hủy</button>
          <button type="submit" disabled={isPending} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {couponId ? 'Cập nhật' : 'Tạo mã'}
          </button>
        </div>
      </form>
    </div>
  )
}
