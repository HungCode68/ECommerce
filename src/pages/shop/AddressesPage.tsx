import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, MapPin } from 'lucide-react'
import { addressApi } from '@/api/address.api'
import { queryKeys } from '@/lib/queryKeys'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

const addressSchema = z.object({
  receiver_name: z.string().min(2, 'Nhập tên người nhận'),
  receiver_phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  province: z.string().min(2, 'Nhập tỉnh/thành phố'),
  district: z.string().min(2, 'Nhập quận/huyện'),
  ward: z.string().min(2, 'Nhập phường/xã'),
  address_detail: z.string().min(5, 'Nhập địa chỉ chi tiết'),
  is_default: z.boolean().optional(),
})

type AddressFormData = z.infer<typeof addressSchema>

type EditState = { id: number } & Partial<AddressFormData>

export function AddressesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editAddress, setEditAddress] = useState<EditState | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: addresses, isLoading } = useQuery({
    queryKey: queryKeys.addressKeys.all,
    queryFn: addressApi.getList,
  })

  const { mutate: deleteAddress, isPending: deleting } = useMutation({
    mutationFn: (id: number) => addressApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa địa chỉ')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: queryKeys.addressKeys.all })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  })

  const { mutate: saveAddress, isPending: saving } = useMutation({
    mutationFn: (data: AddressFormData) =>
      editAddress
        ? addressApi.update(editAddress.id, data)
        : addressApi.create({ ...data, is_default: false }),
    onSuccess: () => {
      toast.success(editAddress ? 'Đã cập nhật địa chỉ!' : 'Đã thêm địa chỉ!')
      setShowForm(false)
      setEditAddress(null)
      reset()
      qc.invalidateQueries({ queryKey: queryKeys.addressKeys.all })
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const openEdit = (addr: NonNullable<typeof addresses>[number]) => {
    setEditAddress({ id: addr.id })
    reset({
      receiver_name: addr.receiver_name,
      receiver_phone: addr.receiver_phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      address_detail: addr.address_detail,
    })
    setShowForm(true)
  }

  const openCreate = () => {
    setEditAddress(null)
    reset({})
    setShowForm(true)
  }

  const FIELDS = [
    { name: 'receiver_name' as const, label: 'Họ tên người nhận' },
    { name: 'receiver_phone' as const, label: 'Số điện thoại' },
    { name: 'province' as const, label: 'Tỉnh / Thành phố' },
    { name: 'district' as const, label: 'Quận / Huyện' },
    { name: 'ward' as const, label: 'Phường / Xã' },
  ]

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Địa chỉ giao hàng</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Thêm địa chỉ
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((d) => saveAddress(d))}
          className="mb-6 rounded-xl border border-primary/20 bg-orange-50 p-5 space-y-3"
        >
          <h3 className="font-semibold text-slate-800">
            {editAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.name}>
                <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                <input
                  {...register(f.name)}
                  className={cn(
                    'w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2',
                    errors[f.name] ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/20',
                  )}
                />
                {errors[f.name] && (
                  <p className="mt-0.5 text-xs text-red-500">{errors[f.name]?.message}</p>
                )}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Địa chỉ chi tiết</label>
              <input
                {...register('address_detail')}
                className={cn(
                  'w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2',
                  errors.address_detail ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/20',
                )}
                placeholder="Số nhà, tên đường..."
              />
              {errors.address_detail && (
                <p className="mt-0.5 text-xs text-red-500">{errors.address_detail.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditAddress(null) }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editAddress ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : !addresses?.length ? (
        <EmptyState
          title="Chưa có địa chỉ"
          description="Thêm địa chỉ giao hàng để tiện mua sắm"
          icon={<MapPin className="h-8 w-8" />}
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                'flex items-start justify-between rounded-xl border bg-white p-4 shadow-sm',
                addr.is_default ? 'border-primary/40' : 'border-slate-100',
              )}
            >
              <div className="text-sm space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{addr.receiver_name}</p>
                  {addr.is_default && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-slate-500">{addr.receiver_phone}</p>
                <p className="text-slate-400">{addr.address_detail}, {addr.ward}, {addr.district}, {addr.province}</p>
              </div>
              <div className="flex shrink-0 gap-1.5 ml-4">
                <button
                  onClick={() => openEdit(addr)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-500"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(addr.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Xóa địa chỉ"
        description="Bạn có chắc muốn xóa địa chỉ này?"
        onConfirm={() => deleteId && deleteAddress(deleteId)}
        loading={deleting}
      />
    </div>
  )
}
