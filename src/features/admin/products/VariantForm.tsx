import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Package2, X } from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/utils/httpError'
import {
  formatVariantLabel,
  isJsonVariantOptionValues,
  normalizeVariantOptionValues,
} from '@/utils/productVariant'
import { bindNumericInput } from '@/utils/numberInput'
import type { ProductVariant } from '@/types/product.types'

const optionalText = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự').optional())

const variantSchema = z.object({
  sku: z.string().min(1, 'Nhập SKU'),
  title: optionalText,
  option_values: z.string().min(1, 'Nhập phân loại'),
  price_override: z.coerce.number().min(0, 'Giá phải >= 0'),
  cost_price: z.coerce.number().min(0, 'Giá vốn phải >= 0'),
  stock_quantity: z.coerce.number().min(0, 'Tồn kho phải >= 0'),
  is_active: z.boolean().default(true),
  allow_backorder: z.boolean().default(false),
})

type VariantFormData = z.infer<typeof variantSchema>

const QUICK_OPTIONS = [
  {
    label: 'Màu sắc',
    values: ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Vàng', 'Xám', 'Bạc', 'Hồng', 'Tím', 'Vàng Đồng'],
  },
  {
    label: 'Dung lượng',
    values: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
  },
  {
    label: 'RAM',
    values: ['4GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
  },
  {
    label: 'Kích thước',
    values: ['13 inch', '14 inch', '15 inch', '16 inch', 'Màn hình 6.1', 'Màn hình 6.7'],
  },
]

type VariantFormProps = {
  productId: number
  productName: string
  variant?: ProductVariant
  onClose: () => void
}

export function VariantForm({ productId, productName, variant, onClose }: VariantFormProps) {
  const qc = useQueryClient()
  const isEdit = !!variant

  const generateAutoSKU = (name: string, options: string) => {
    // 1. Process Product Name
    let namePart = name
      .replace(/iPhone/i, 'IP')
      .replace(/Samsung Galaxy/i, 'SG')
      .replace(/Xiaomi/i, 'XM')
      .replace(/Google Pixel/i, 'GP')
      .replace(/OPPO/i, 'OP')
      .split(' ')
      .map((word, i) => {
        if (i === 0) return word
        if (/\d/.test(word)) return word
        return word.charAt(0).toUpperCase()
      })
      .join('')
      .replace(/[^A-Z0-9]/g, '')

    // 2. Extract values
    const getVal = (label: string) => {
      const match = options.match(new RegExp(`${label}:\\s*([^,]+)`, 'i'))
      return match ? match[1].trim() : ''
    }

    const capacity = getVal('Dung lượng').replace(/GB|TB/i, '')
    const colorMap: Record<string, string> = {
      Đen: 'BLK',
      Trắng: 'WHT',
      Xanh: 'BLU',
      Đỏ: 'RED',
      Vàng: 'GLD',
      Xám: 'GRY',
      Bạc: 'SLV',
      Hồng: 'PNK',
      Tím: 'PUR',
      'Vàng Đồng': 'BRZ',
    }
    const colorRaw = getVal('Màu sắc')
    const color = colorMap[colorRaw] || (colorRaw ? colorRaw.slice(0, 3).toUpperCase() : '')

    const parts = [namePart]
    if (capacity) parts.push(capacity)
    if (color) parts.push(color)
    parts.push('VN')

    return parts.filter(Boolean).join('-')
  }

  const generateAutoTitle = (name: string, options: string) => {
    const getVal = (label: string) => {
      const match = options.match(new RegExp(`${label}:\\s*([^,]+)`, 'i'))
      return match ? match[1].trim() : ''
    }

    const color = getVal('Màu sắc')
    const capacity = getVal('Dung lượng')

    return [name, color, capacity].filter(Boolean).join(' ')
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: variant
      ? {
          sku: variant.sku,
          title: variant.title ?? '',
          option_values: variant.option_values ?? formatVariantLabel(variant),
          price_override: variant.price_override ?? variant.price ?? 0,
          cost_price: variant.cost_price ?? 0,
          stock_quantity: variant.stock_quantity ?? variant.stock ?? 0,
          is_active: variant.is_active ?? true,
          allow_backorder: variant.allow_backorder ?? false,
        }
      : {
          sku: '',
          title: '',
          option_values: '',
          price_override: 0,
          cost_price: 0,
          stock_quantity: 0,
          is_active: true,
          allow_backorder: false,
        },
  })
  const currentOptionValues = watch('option_values')

  const isOptionSelected = (label: string, value: string) => {
    const pair = `${label}: ${value}`
    return currentOptionValues?.includes(pair)
  }

  const appendOption = (label: string, value: string) => {
    const pair = `${label}: ${value}`
    let newOptions = ''

    if (!currentOptionValues) {
      newOptions = pair
    } else {
      // Split into parts and replace if label exists
      const parts = currentOptionValues.split(',').map((p) => p.trim())
      const labelPrefix = `${label}:`
      const existingIndex = parts.findIndex((p) => p.startsWith(labelPrefix))

      if (existingIndex > -1) {
        // If clicking the same value, remove it (toggle)
        if (parts[existingIndex] === pair) {
          parts.splice(existingIndex, 1)
        } else {
          // Replace with new value
          parts[existingIndex] = pair
        }
      } else {
        parts.push(pair)
      }
      newOptions = parts.filter(Boolean).join(', ')
    }

    setValue('option_values', newOptions)

    // Auto-generate SKU & Title
    if (!isEdit) {
      const autoSKU = generateAutoSKU(productName, newOptions)
      const autoTitle = generateAutoTitle(productName, newOptions)
      setValue('sku', autoSKU)
      setValue('title', autoTitle)
    }
  }
  const optionValuesDefaultLabel = variant ? formatVariantLabel(variant) : ''
  const optionValuesDefaultRaw = variant?.option_values?.trim() ?? ''

  const priceOverrideField = register('price_override')
  const costPriceField = register('cost_price')
  const stockQuantityField = register('stock_quantity')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: VariantFormData) => {
      const normalizedOptionValues = normalizeVariantOptionValues(data.option_values)
      const shouldPreserveOriginal =
        isEdit &&
        optionValuesDefaultRaw.length > 0 &&
        isJsonVariantOptionValues(optionValuesDefaultRaw) &&
        data.option_values.trim() === optionValuesDefaultLabel

      const payload = {
        ...data,
        option_values: shouldPreserveOriginal
          ? optionValuesDefaultRaw
          : normalizedOptionValues,
      }

      return isEdit
        ? adminProductApi.updateVariant(productId, variant.id, payload)
        : adminProductApi.createVariant(productId, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật biến thể thành công!' : 'Thêm biến thể thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.all })
      qc.invalidateQueries({ queryKey: queryKeys.products.all })
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.detail(productId) })
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.history(productId) })
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(productId) })
      onClose()
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại')),
  })

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/70 via-white to-slate-50 p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700">
            <Package2 className="h-3.5 w-3.5" />
            Biến thể
          </div>
          <h4 className="mt-3 font-headline text-lg font-bold text-slate-900">
            {isEdit ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới'}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Thiết lập SKU, phân loại, giá ghi đè, giá vốn và tồn kho.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:border-cyan-200 hover:text-cyan-700"
          aria-label="Đóng form biến thể"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SKU *" error={errors.sku?.message}>
            <input
              {...register('sku')}
              placeholder="SKU-001-L-BLACK"
              className={inputClass(!!errors.sku)}
            />
          </Field>

          <Field label="Tiêu đề biến thể" error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="iPhone 15 Pro Max Đen 128GB"
              className={inputClass(!!errors.title)}
            />
          </Field>

          <Field label="Phân loại *" error={errors.option_values?.message} className="md:col-span-2">
            <div className="mb-3 flex flex-col gap-3">
              {QUICK_OPTIONS.map((group) => (
                <div key={group.label} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 w-20">
                    {group.label}:
                  </span>
                  {group.values.map((val) => {
                    const active = isOptionSelected(group.label, val)
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => appendOption(group.label, val)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all active:scale-95',
                          active
                            ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm shadow-cyan-100'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-400 hover:text-cyan-600',
                        )}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <textarea
              {...register('option_values')}
              rows={2}
              placeholder="Màu: Đen, Dung lượng: 128GB"
              className={cn(inputClass(!!errors.option_values), 'resize-none')}
            />
            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              Có thể nhập hoặc chọn từ gợi ý bên trên. Hệ thống sẽ tự lưu thành JSON hợp lệ.
            </p>
          </Field>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Giá bán ghi đè (₫) *" error={errors.price_override?.message}>
              <input
                {...priceOverrideField}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="299000"
                className={inputClass(!!errors.price_override)}
                onChange={bindNumericInput(priceOverrideField)}
              />
            </Field>

            <Field label="Giá vốn (₫)" error={errors.cost_price?.message}>
              <input
                {...costPriceField}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="0"
                className={inputClass(!!errors.cost_price)}
                onChange={bindNumericInput(costPriceField)}
              />
            </Field>

            <Field label="Tồn kho" error={errors.stock_quantity?.message}>
              <input
                {...stockQuantityField}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="0"
                className={inputClass(!!errors.stock_quantity)}
                onChange={bindNumericInput(stockQuantityField)}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Đang bán
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                {...register('allow_backorder')}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Cho phép bán khi hết hàng
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-primary-container px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:scale-100"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? 'Cập nhật' : 'Thêm biến thể'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
        {label}
      </label>
      {children}
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 transition-colors',
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-200',
  )
}
