import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, Tag, Calendar, ShoppingBag, ShieldCheck, UserCheck, Percent, DollarSign } from 'lucide-react'
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
  value: z.coerce.number().min(1, 'Giá trị phải lớn hơn 0'),
  min_order_amount: z.coerce.number().min(0, 'Giá trị tối thiểu không âm'),
  max_usage: z.coerce.number().min(1, 'Lượt dùng phải lớn hơn 0'),
  max_usage_per_user: z.coerce.number().min(1, 'Lượt dùng mỗi khách hàng tối thiểu là 1'),
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
      toast.success('Đã xóa mã giảm giá thành công!')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons.all })
    },
    onError: () => toast.error('Không thể xóa mã giảm giá này'),
  })

  const coupons = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Mã giảm giá</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý các chương trình khuyến mãi và phiếu giảm giá ({total} mã)</p>
        </div>
        <button
          onClick={() => { setEditId(null); setShowForm(true) }}
          className="flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tạo mã giảm giá
        </button>
      </div>

      {showForm && (
        <CouponForm 
          couponId={editId ?? undefined} 
          onClose={() => { setShowForm(false); setEditId(null) }} 
        />
      )}

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : coupons.length === 0 ? (
        <EmptyState title="Chưa có mã giảm giá" description="Tạo mã giảm giá để khuyến khích khách hàng mua sắm nhiều hơn" />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider">Mã coupon</th>
                  <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider">Loại</th>
                  <th className="px-5 py-4 text-right font-bold text-slate-600 uppercase tracking-wider">Giá trị giảm</th>
                  <th className="px-5 py-4 text-right font-bold text-slate-600 uppercase tracking-wider">Đơn tối thiểu</th>
                  <th className="px-5 py-4 text-right font-bold text-slate-600 uppercase tracking-wider">Đã dùng / Giới hạn</th>
                  <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider">Hết hạn</th>
                  <th className="px-5 py-4 text-center font-bold text-slate-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono font-black text-sm bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
                        coupon.type === 'percent' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      )}>
                        {coupon.type === 'percent' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {coupon.type === 'percent' ? 'Phần trăm' : 'Cố định'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-black text-slate-900">
                      {coupon.type === 'percent' ? `${coupon.value}%` : formatVND(coupon.value)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-600">
                      {formatVND(coupon.min_order_amount)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-600">
                      <span className="font-bold text-slate-800">{coupon.used_count}</span>
                      <span className="text-slate-400"> / {coupon.max_usage} lượt</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {formatDate(coupon.expired_at)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => { setEditId(coupon.id); setShowForm(true) }} 
                          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          title="Sửa mã"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(coupon.id)} 
                          className="rounded-xl p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                          title="Xóa mã"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 px-5 py-4 flex justify-end bg-slate-50/50">
            <Pagination page={page} totalPages={totalPages(total)} onPageChange={goToPage} />
          </div>
        </div>
      )}

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(o) => !o && setDeleteId(null)} 
        title="Xóa mã giảm giá" 
        description="Bạn có chắc chắn muốn xóa mã này? Khách hàng sẽ không thể sử dụng mã này được nữa." 
        onConfirm={() => deleteId && deleteOne(deleteId)} 
        loading={deleting} 
      />
    </div>
  )
}

function CouponForm({ couponId, onClose }: { couponId?: number; onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: 'percent', max_usage_per_user: 1, min_order_amount: 0 },
  })

  // Fetch coupon detail for editing
  const { data: coupon, isLoading: loadingDetail } = useQuery({
    queryKey: ['admin-coupon-detail', couponId],
    queryFn: () => adminCouponApi.getDetail(couponId!),
    enabled: !!couponId,
  })

  useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        min_order_amount: coupon.min_order_amount,
        max_usage: coupon.max_usage,
        max_usage_per_user: coupon.max_usage_per_user,
        expired_at: coupon.expired_at ? new Date(coupon.expired_at).toISOString().slice(0, 16) : '',
      })
    }
  }, [coupon, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CouponFormData) =>
      couponId ? adminCouponApi.update(couponId, data) : adminCouponApi.create(data),
    onSuccess: () => {
      toast.success(couponId ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons.all })
      onClose()
    },
    onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại'),
  })

  const type = watch('type')

  if (couponId && loadingDetail) {
    return (
      <div className="flex items-center justify-center p-8 rounded-[24px] border border-slate-200 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-slate-600 mr-2" />
        <span className="text-sm font-semibold text-slate-500">Đang tải thông tin mã giảm giá...</span>
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900 mb-5">{couponId ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h3>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Code */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Tag className="h-3.5 w-3.5" /> Mã coupon *
            </label>
            <input
              {...register('code')}
              type="text"
              placeholder="VÍ DỤ: KM20"
              className={cn(
                'w-full rounded-xl border bg-white px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-200',
                errors.code ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {errors.code && <p className="text-xs font-bold text-red-500">{errors.code.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              Loại giảm giá *
            </label>
            <select 
              {...register('type')} 
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="percent">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (₫)</option>
            </select>
          </div>

          {/* Value */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              {type === 'percent' ? 'Mức giảm (%) *' : 'Số tiền giảm (₫) *'}
            </label>
            <input
              {...register('value')}
              type="number"
              placeholder={type === 'percent' ? '10' : '50000'}
              className={cn(
                'w-full rounded-xl border bg-white px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-200',
                errors.value ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {errors.value && <p className="text-xs font-bold text-red-500">{errors.value.message}</p>}
          </div>

          {/* Min Order Amount */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <ShoppingBag className="h-3.5 w-3.5" /> Đơn hàng tối thiểu (₫)
            </label>
            <input
              {...register('min_order_amount')}
              type="number"
              placeholder="200000"
              className={cn(
                'w-full rounded-xl border bg-white px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-200',
                errors.min_order_amount ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {errors.min_order_amount && <p className="text-xs font-bold text-red-500">{errors.min_order_amount.message}</p>}
          </div>

          {/* Max Usage */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Tổng số lượt dùng tối đa *
            </label>
            <input
              {...register('max_usage')}
              type="number"
              placeholder="100"
              className={cn(
                'w-full rounded-xl border bg-white px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-200',
                errors.max_usage ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {errors.max_usage && <p className="text-xs font-bold text-red-500">{errors.max_usage.message}</p>}
          </div>

          {/* Max Usage Per User */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <UserCheck className="h-3.5 w-3.5" /> Lượt dùng / mỗi khách hàng *
            </label>
            <input
              {...register('max_usage_per_user')}
              type="number"
              placeholder="1"
              className={cn(
                'w-full rounded-xl border bg-white px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-200',
                errors.max_usage_per_user ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {errors.max_usage_per_user && <p className="text-xs font-bold text-red-500">{errors.max_usage_per_user.message}</p>}
          </div>

          {/* Expired At */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Calendar className="h-3.5 w-3.5" /> Ngày & giờ hết hạn *
            </label>
            <input
              {...register('expired_at')}
              type="datetime-local"
              className={cn(
                'w-full rounded-xl border bg-white px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-200',
                errors.expired_at ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400'
              )}
            />
            {errors.expired_at && <p className="text-xs font-bold text-red-500">{errors.expired_at.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            disabled={isPending} 
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {couponId ? 'Lưu thay đổi' : 'Tạo ngay'}
          </button>
        </div>
      </form>
    </div>
  )
}
