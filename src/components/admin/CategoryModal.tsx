import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { adminCategoryApi } from '@/api/admin/adminCategory.api'
import { queryKeys } from '@/lib/queryKeys'
import type { Category } from '@/api/category.api'

const categorySchema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  slug: z
    .string()
    .min(2, 'Slug tối thiểu 2 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu -'),
  description: z.string().optional(),
  parent_id: z.number().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
})

type CategoryFormData = z.infer<typeof categorySchema>

type CategoryModalProps = {
  open: boolean
  mode: 'add' | 'edit'
  category?: Category
  onClose: () => void
}

export function CategoryModal({ open, mode, category, onClose }: CategoryModalProps) {
  const qc = useQueryClient()

  // Lấy danh sách danh mục (để chọn parent)
  const { data: categoriesResponse } = useQuery({
    queryKey: queryKeys.admin.categories.all,
    queryFn: () => adminCategoryApi.getList({ page: 1, limit: 100 }),
    enabled: open,
  })

  const categories = categoriesResponse?.data || []

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues:
      mode === 'edit' && category
        ? {
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parent_id: category.parent_id,
            status: category.status || 'active',
          }
        : {
            name: '',
            slug: '',
            description: '',
            parent_id: null,
            status: 'active',
          },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CategoryFormData) =>
      mode === 'edit' && category
        ? adminCategoryApi.update(category.id, data)
        : adminCategoryApi.create({ ...data, description: data.description || '' }),
    onSuccess: () => {
      toast.success(mode === 'edit' ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.categories.all })
      onClose()
    },
    onError: (error: any) => {
      if (error.response?.status === 409 || error.response?.data?.message?.includes('slug')) {
        setError('slug', { message: 'Slug đã tồn tại' })
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại')
      }
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="mb-6">
          <h2 className="text-xl font-headline font-bold text-on-surface">
            {mode === 'edit' ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Điền thông tin chi tiết cho danh mục sản phẩm.
          </p>
        </div>

        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Tên danh mục *
            </label>
            <input
              {...register('name')}
              onChange={(e) => {
                register('name').onChange(e)
                if (mode === 'add') {
                  const val = e.target.value
                  const normalized = val
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')
                  setValue('slug', normalized, { shouldValidate: true })
                }
              }}
              placeholder="VD: Laptop Gaming"
              className="w-full rounded-lg bg-surface-container-low px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Đường dẫn (Slug) *
            </label>
            <input
              {...register('slug')}
              placeholder="vd: laptop-gaming"
              className="w-full rounded-lg bg-surface-container-low px-4 py-2.5 text-sm font-mono border-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.slug && <p className="mt-1 text-xs text-error">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Danh mục cha
            </label>
            <select
              {...register('parent_id', {
                setValueAs: (v) => (v === '' ? null : Number(v)),
              })}
              className="w-full rounded-lg bg-surface-container-low px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Không có (Danh mục gốc)</option>
              {categories
                .filter((c) => c.id !== category?.id) // Không cho chọn chính nó
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Trạng thái
            </label>
            <select
              {...register('status')}
              className="w-full rounded-lg bg-surface-container-low px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Mô tả
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Mô tả chi tiết về danh mục..."
              className="w-full resize-none rounded-lg bg-surface-container-low px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
