import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { adminCategoryApi } from '@/api/admin/adminCategory.api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/utils/httpError'
import { bindNumericInput } from '@/utils/numberInput'
import type { Product } from '@/types/product.types'

const productSchema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  slug: z.string().min(2, 'Slug tối thiểu 2 ký tự'),
  short_description: z.string().max(500, 'Mô tả ngắn tối đa 500 ký tự').optional(),
  description: z.string().min(10, 'Mô tả tối thiểu 10 ký tự'),
  brand: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('active'),
  is_published: z.boolean().default(true),
  is_coupon_eligible: z.boolean().default(true),
  category_id: z.coerce.number().min(1, 'Chọn danh mục'),
  min_price: z.coerce.number().min(0).default(0), // default for create, variants will override
  discount_percent: z.coerce.number().min(0).max(100).default(0),
  stock: z.coerce.number().min(0).default(0), // basic stock handled via variants
})

type ProductFormData = z.infer<typeof productSchema>

type ProductFormProps = {
  product?: Product
  onSuccess: (newProduct?: Product) => void
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const qc = useQueryClient()
  const isEdit = !!product

  const { data: categories } = useQuery({
    queryKey: queryKeys.admin.categories.list({ page: 1, limit: 100 }),
    queryFn: () => adminCategoryApi.getList({ page: 1, limit: 100 }),
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name ?? '',
          slug: product.slug ?? '',
          short_description: product.short_description ?? undefined,
          description: product.description ?? '',
          brand: product.brand ?? undefined,
          status: product.status ?? 'active',
          is_published: product.is_published ?? true,
          is_coupon_eligible: product.is_coupon_eligible ?? true,
          category_id: product.category_id ?? product.categories?.[0]?.id ?? 0,
          min_price: product.min_price ?? 0,
          discount_percent: product.discount_percent ?? 0,
          stock: product.stock ?? 0,
        }
      : {
          status: 'active',
          is_published: true,
          is_coupon_eligible: true,
          discount_percent: 0,
        },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ProductFormData) => {
      // Create a clean payload with only backend-supported fields
      const payload = {
        name: data.name,
        slug: data.slug,
        short_description: data.short_description,
        description: data.description,
        brand: data.brand,
        status: data.status,
        is_published: data.is_published,
        is_coupon_eligible: data.is_coupon_eligible,
        min_price: data.min_price,
        discount_percent: data.discount_percent,
        category_ids: [data.category_id],
      }
      return isEdit
        ? adminProductApi.update(product.id, payload)
        : adminProductApi.create(payload)
    },
    onSuccess: (data) => {
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm sản phẩm thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.all })
      onSuccess(data)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại')),
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setValue('slug', slug)
  }

  const minPriceField = register('min_price')
  const discountPercentField = register('discount_percent')

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-8">
      {/* Basic Info Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Thông tin cơ bản</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên sản phẩm *" error={errors.name?.message}>
            <input
              {...register('name')}
              onChange={(e) => {
                register('name').onChange(e)
                handleNameChange(e)
              }}
              placeholder="Ví dụ: iPhone 15 Pro Max"
              className={inputClass(!!errors.name)}
            />
          </Field>

          <Field label="Slug (Đường dẫn) *" error={errors.slug?.message}>
            <input
              {...register('slug')}
              placeholder="iphone-15-pro-max"
              className={inputClass(!!errors.slug)}
            />
          </Field>

          <Field label="Thương hiệu" error={errors.brand?.message}>
            <input
              {...register('brand')}
              placeholder="Ví dụ: Apple"
              className={inputClass(!!errors.brand)}
            />
          </Field>

          <Field label="Danh mục *" error={errors.category_id?.message}>
            <select
              {...register('category_id')}
              className={inputClass(!!errors.category_id)}
            >
              <option value="">-- Chọn danh mục --</option>
              {/* @ts-ignore - Handle nested structure from APIResponse */}
              {(categories?.data as any)?.categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Pricing & Inventory Section - Only in Edit Mode */}
      {isEdit && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Giá & Kho</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Giá sản phẩm (tự động)" error={errors.min_price?.message}>
              <input
                {...minPriceField}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="0"
                readOnly
                className={inputClass(!!errors.min_price)}
                onChange={bindNumericInput(minPriceField)}
              />
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Lấy theo biến thể có giá thấp nhất, không nhập tay.
              </p>
            </Field>

            <Field label="Giảm giá (%)" error={errors.discount_percent?.message}>
              <input
                {...discountPercentField}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="0"
                className={inputClass(!!errors.discount_percent)}
                onChange={bindNumericInput(discountPercentField)}
              />
            </Field>

            <Field label="Số lượng tồn kho (Tổng)" error={errors.stock?.message}>
              <input
                {...register('stock')}
                type="text"
                readOnly
                placeholder="0"
                className={cn(inputClass(!!errors.stock), 'bg-slate-50 cursor-not-allowed font-mono text-cyan-600')}
              />
            </Field>
          </div>
        </section>
      )}

      {/* Description Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Mô tả sản phẩm</h3>
        <Field label="Mô tả ngắn" error={errors.short_description?.message}>
          <input
            {...register('short_description')}
            placeholder="Tóm tắt về sản phẩm..."
            className={inputClass(!!errors.short_description)}
          />
        </Field>

        <Field label="Mô tả chi tiết *" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={5}
            placeholder="Viết mô tả chi tiết cho sản phẩm của bạn..."
            className={cn(inputClass(!!errors.description), 'resize-none')}
          />
        </Field>
      </section>

      {/* Settings Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Cấu hình hiển thị</h3>
        <div className="flex flex-wrap items-center gap-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              {...register('is_published')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-slate-700">Công khai sản phẩm</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_coupon_eligible"
              {...register('is_coupon_eligible')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_coupon_eligible" className="text-sm font-medium text-slate-700">Cho phép áp dụng Coupon</label>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Trạng thái:</label>
            <select
              {...register('status')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="active">Đang bán</option>
              <option value="draft">Bản nháp</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]",
            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
            "shadow-lg shadow-blue-200 disabled:opacity-60 disabled:scale-100 disabled:shadow-none"
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Cập nhật sản phẩm' : 'Tiếp tục: Thêm biến thể'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2.5 text-sm placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 transition-colors',
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200',
  )
}
