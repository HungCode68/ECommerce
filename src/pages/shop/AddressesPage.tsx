import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BadgePlus,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { addressApi } from '@/api/address.api'
import { queryKeys } from '@/lib/queryKeys'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import type { Address } from '@/types/address.types'

const addressSchema = z.object({
  receiver_name: z.string().min(2, 'Nhập tên người nhận'),
  receiver_phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  province: z.string().min(2, 'Nhập tỉnh/thành phố'),
  district: z.string().optional(),
  ward: z.string().min(2, 'Nhập phường/xã'),
  address_detail: z.string().min(5, 'Nhập địa chỉ chi tiết'),
  is_default: z.boolean().optional(),
})

type AddressFormData = z.infer<typeof addressSchema>
type EditState = { id: number } & Partial<AddressFormData>

function formatAddress(address: Pick<Address, 'address_detail' | 'ward' | 'province'>) {
  return [address.address_detail, address.ward, address.province]
    .filter(Boolean)
    .join(', ')
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  settingDefault,
}: {
  address: Address
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  settingDefault: boolean
}) {
  return (
    <article
      className={cn(
        'rounded-[24px] border bg-white p-5 shadow-sm transition-colors md:p-6',
        address.is_default ? 'border-primary/35' : 'border-slate-200',
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{address.receiver_name}</h2>
            {address.is_default ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                Mặc định
              </span>
            ) : null}
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{address.receiver_phone}</span>
            </p>
            <p className="flex items-start gap-2 leading-6">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formatAddress(address)}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-slate-200 pt-1 md:ml-6 md:min-w-[160px] md:border-l md:pl-6">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-start gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-start gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </button>
          {!address.is_default ? (
            <button
              type="button"
              onClick={onSetDefault}
              disabled={settingDefault}
              className="flex items-center justify-start gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {settingDefault ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Đặt làm mặc định
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function AddressesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editAddress, setEditAddress] = useState<EditState | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: queryKeys.addressKeys.all,
    queryFn: addressApi.getList,
  })

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => {
        if (a.is_default === b.is_default) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return a.is_default ? -1 : 1
      }),
    [addresses],
  )

  const primaryAddress = sortedAddresses[0]
  const secondaryAddresses = sortedAddresses.slice(1)

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
    watch,
    setError,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { is_default: false },
  })

  const { mutate: saveAddress, isPending: saving } = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const payload = {
        receiver_name: data.receiver_name,
        receiver_phone: data.receiver_phone,
        province: data.province,
        district: data.district ?? '',
        ward: data.ward,
        address_detail: data.address_detail,
        is_default: Boolean(data.is_default),
      }

      const saved = editAddress
        ? await addressApi.update(editAddress.id, payload)
        : await addressApi.create(payload)

      if (payload.is_default) {
        return addressApi.setDefault(saved.id)
      }

      return saved
    },
    onSuccess: () => {
      toast.success(editAddress ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới')
      setShowForm(false)
      setEditAddress(null)
      reset({ is_default: false })
      qc.invalidateQueries({ queryKey: queryKeys.addressKeys.all })
    },
    onError: (error: any) => {
      const responseData = error?.response?.data
      const validationErrors = responseData?.errors
      
      if (validationErrors && typeof validationErrors === 'object') {
        Object.entries(validationErrors).forEach(([field, msg]) => {
          const fieldLower = field.toLowerCase()
          let formField: keyof AddressFormData | null = null
          
          if (fieldLower.includes('name')) formField = 'receiver_name'
          else if (fieldLower.includes('phone')) formField = 'receiver_phone'
          else if (fieldLower.includes('province') || fieldLower.includes('state')) formField = 'province'
          else if (fieldLower.includes('ward') || fieldLower.includes('city')) formField = 'ward'
          else if (fieldLower.includes('detail') || fieldLower.includes('line1')) formField = 'address_detail'
          else if (fieldLower.includes('district')) formField = 'district'
          
          if (formField) {
            setError(formField, { type: 'server', message: String(msg) })
          }
        })
        toast.error('Vui lòng kiểm tra lại các thông tin lỗi màu đỏ trên Form')
      } else {
        const errMsg = responseData?.message || 'Không thể lưu địa chỉ'
        toast.error(errMsg)
      }
    },
  })

  const { mutate: setDefaultAddress, isPending: settingDefault } = useMutation({
    mutationFn: (id: number) => addressApi.setDefault(id),
    onSuccess: () => {
      toast.success('Đã cập nhật địa chỉ mặc định')
      qc.invalidateQueries({ queryKey: queryKeys.addressKeys.all })
    },
    onError: () => toast.error('Không thể đặt địa chỉ mặc định'),
  })

  const openEdit = (addr: Address) => {
    setEditAddress({ id: addr.id })
    reset({
      receiver_name: addr.receiver_name,
      receiver_phone: addr.receiver_phone,
      province: addr.province,
      district: '',
      ward: addr.ward,
      address_detail: addr.address_detail,
      is_default: addr.is_default,
    })
    setShowForm(true)
  }

  const openCreate = () => {
    setEditAddress(null)
    reset({
      receiver_name: '',
      receiver_phone: '',
      province: '',
      district: '',
      ward: '',
      address_detail: '',
      is_default: addresses.length === 0,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditAddress(null)
    reset({ is_default: false })
  }

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2',
      hasError
        ? 'border-red-300 focus:ring-red-200'
        : 'border-slate-200 focus:border-primary focus:ring-primary/15',
    )

  const fields = [
    { name: 'receiver_name' as const, label: 'Họ và tên người nhận', placeholder: 'Nguyễn Văn A' },
    { name: 'receiver_phone' as const, label: 'Số điện thoại', placeholder: '0901234567' },
    { name: 'province' as const, label: 'Tỉnh / Thành phố', placeholder: 'Hồ Chí Minh' },
    { name: 'ward' as const, label: 'Phường / Xã', placeholder: 'Phường Bến Nghé' },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sổ địa chỉ</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý các địa chỉ giao hàng của bạn để thanh toán nhanh chóng hơn.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <BadgePlus className="h-4 w-4" />
          Thêm địa chỉ mới
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit((data) => saveAddress(data))}
          className="mb-6 rounded-[28px] border border-primary/20 bg-white p-5 shadow-sm md:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Nhập đúng thông tin người nhận để đơn hàng đến nơi nhanh và chính xác.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{field.label}</label>
                <input
                  {...register(field.name)}
                  placeholder={field.placeholder}
                  className={inputClass(Boolean(errors[field.name]))}
                />
                {errors[field.name] ? <p className="mt-1.5 text-xs text-red-500">{errors[field.name]?.message}</p> : null}
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Địa chỉ chi tiết</label>
              <textarea
                {...register('address_detail')}
                rows={3}
                placeholder="Số nhà, tên đường, tòa nhà..."
                className={inputClass(Boolean(errors.address_detail))}
              />
              {errors.address_detail ? <p className="mt-1.5 text-xs text-red-500">{errors.address_detail.message}</p> : null}
            </div>
          </div>

          <label className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" {...register('is_default')} className="rounded border-slate-300 text-primary focus:ring-primary" />
            <span>
              Dùng làm địa chỉ mặc định
              {watch('is_default') ? <span className="ml-2 text-xs font-semibold text-primary">Sẽ ưu tiên khi thanh toán</span> : null}
            </span>
          </label>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editAddress ? 'Lưu thay đổi' : 'Lưu địa chỉ'}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-[24px] bg-slate-100" />
          ))}
        </div>
      ) : sortedAddresses.length === 0 ? (
        <EmptyState
          className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 shadow-sm"
          title="Chưa có địa chỉ giao hàng"
          description="Thêm địa chỉ đầu tiên để có thể chọn nhanh ở bước thanh toán."
          icon={<MapPin className="h-8 w-8" />}
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Thêm địa chỉ mới
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {primaryAddress ? (
            <AddressCard
              address={primaryAddress}
              onEdit={() => openEdit(primaryAddress)}
              onDelete={() => setDeleteId(primaryAddress.id)}
              onSetDefault={() => setDefaultAddress(primaryAddress.id)}
              settingDefault={settingDefault}
            />
          ) : null}

          {secondaryAddresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => openEdit(address)}
              onDelete={() => setDeleteId(address.id)}
              onSetDefault={() => setDefaultAddress(address.id)}
              settingDefault={settingDefault}
            />
          ))}

          {secondaryAddresses.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-[#fffaf7] px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Chưa có địa chỉ phụ?</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                Thêm địa chỉ văn phòng hoặc nhà người thân để việc nhận hàng linh hoạt hơn.
              </p>
            </div>
          ) : null}
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
