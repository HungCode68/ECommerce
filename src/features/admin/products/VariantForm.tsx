import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Package2, Trash2, X } from 'lucide-react'
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
  thumbnail_url: z.string().optional(),
})

type VariantFormData = z.infer<typeof variantSchema>

type VariantOptionGroup = {
  label: string
  values: string[]
}

type VariantSelectionMap = Record<string, string[]>

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
] satisfies VariantOptionGroup[]

type VariantFormProps = {
  productId: number
  productName: string
  variant?: ProductVariant
  onClose: () => void
}

export function VariantForm({ productId, productName, variant, onClose }: VariantFormProps) {
  const qc = useQueryClient()
  const isEdit = !!variant
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkSelections, setBulkSelections] = useState<VariantSelectionMap>({})
  const [optionGroups, setOptionGroups] = useState<VariantOptionGroup[]>(QUICK_OPTIONS)
  const [draftOptionValues, setDraftOptionValues] = useState<Record<string, string>>({})

  const parseOptionEntries = (options: string) =>
    options
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [label, ...rest] = part.split(':')
        return {
          label: label?.trim() ?? '',
          value: rest.join(':').trim(),
        }
      })
      .filter((entry) => entry.label && entry.value)

  const normalizeToken = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')

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

  const generateAutoSKU = (name: string, options: string) => {
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

    const optionTokens = parseOptionEntries(options).map(({ label, value }) => {
      if (label === 'Màu sắc') {
        return colorMap[value] || normalizeToken(value).slice(0, 4)
      }

      if (label === 'Dung lượng') {
        return normalizeToken(value)
      }

      if (label === 'Kích thước') {
        return normalizeToken(value).replace(/INCH/g, 'IN')
      }

      return normalizeToken(value).slice(0, 6)
    })

    const parts = [namePart, ...optionTokens.filter(Boolean)]
    parts.push('VN')

    return parts.filter(Boolean).join('-')
  }

  const generateAutoTitle = (name: string, options: string) => {
    const values = parseOptionEntries(options).map((entry) => entry.value)
    return [name, ...values].filter(Boolean).join(' ')
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
          thumbnail_url: variant.thumbnail_url ?? '',
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
          thumbnail_url: '',
        },
  })
  const thumbnailUrl = watch('thumbnail_url')

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (file: File) => adminProductApi.uploadImage(file),
    onSuccess: (url) => {
      setValue('thumbnail_url', url, { shouldDirty: true, shouldValidate: true })
      toast.success('Tải ảnh lên thành công!')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể tải ảnh lên')),
  })
  const currentOptionValues = watch('option_values')

  const buildBulkCombinations = (selections: VariantSelectionMap) => {
    const activeGroups = optionGroups
      .map((group) => ({
        label: group.label,
        values: selections[group.label] ?? [],
      }))
      .filter((group) => group.values.length > 0)

    if (activeGroups.length === 0) {
      return [] as Array<Array<{ label: string; value: string }>>
    }

    return activeGroups.reduce<Array<Array<{ label: string; value: string }>>>(
      (combinations, group) => {
        if (combinations.length === 0) {
          return group.values.map((value) => [{ label: group.label, value }])
        }

        return combinations.flatMap((combo) =>
          group.values.map((value) => [...combo, { label: group.label, value }]),
        )
      },
      [],
    )
  }

  const bulkCombinations = buildBulkCombinations(bulkSelections)

  const formatCombinationOptionValues = (entries: Array<{ label: string; value: string }>) =>
    entries.map((entry) => `${entry.label}: ${entry.value}`).join(', ')

  useEffect(() => {
    if (isEdit || !isBulkMode) {
      return
    }

    if (bulkCombinations.length === 0) {
      setValue('sku', 'AUTO-BULK')
      setValue('title', productName)
      setValue('option_values', 'Tự động tạo theo tổ hợp')
      return
    }

    const previewOptions = formatCombinationOptionValues(bulkCombinations[0])
    setValue('sku', generateAutoSKU(productName, previewOptions))
    setValue('title', generateAutoTitle(productName, previewOptions))
    setValue('option_values', previewOptions)
  }, [bulkCombinations, isBulkMode, isEdit, productName, setValue])

  const isOptionSelected = (label: string, value: string) => {
    if (isBulkMode && !isEdit) {
      return (bulkSelections[label] ?? []).includes(value)
    }

    const pair = `${label}: ${value}`
    return currentOptionValues?.includes(pair)
  }

  const isCustomQuickOption = (label: string, value: string) =>
    !QUICK_OPTIONS.some(
      (group) => group.label === label && group.values.includes(value),
    )

  const addQuickOptionValue = (label: string) => {
    const nextValue = draftOptionValues[label]?.trim()
    if (!nextValue) {
      return
    }

    const group = optionGroups.find((item) => item.label === label)
    if (!group) {
      return
    }

    if (group.values.some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
      toast.error('Giá trị này đã tồn tại')
      return
    }

    setOptionGroups((current) =>
      current.map((item) =>
        item.label === label
          ? { ...item, values: [...item.values, nextValue] }
          : item,
      ),
    )
    setDraftOptionValues((current) => ({ ...current, [label]: '' }))
  }

  const removeQuickOptionValue = (label: string, value: string) => {
    if (!isCustomQuickOption(label, value)) {
      return
    }

    setOptionGroups((current) =>
      current.map((item) =>
        item.label === label
          ? { ...item, values: item.values.filter((entry) => entry !== value) }
          : item,
      ),
    )

    setBulkSelections((current) => ({
      ...current,
      [label]: (current[label] ?? []).filter((entry) => entry !== value),
    }))

    const pair = `${label}: ${value}`
    const nextOptions = (currentOptionValues ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part && part !== pair)
      .join(', ')

    if (nextOptions !== currentOptionValues) {
      setValue('option_values', nextOptions)
    }
  }

  const toggleBulkOption = (label: string, value: string) => {
    setBulkSelections((current) => {
      const currentValues = current[label] ?? []
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]

      return {
        ...current,
        [label]: nextValues,
      }
    })
  }

  const appendOption = (label: string, value: string) => {
    if (isBulkMode && !isEdit) {
      toggleBulkOption(label, value)
      return
    }

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
    mutationFn: async (data: VariantFormData) => {
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

      if (isEdit) {
        await adminProductApi.updateVariant(productId, variant.id, payload)
        return { mode: 'edit' as const, count: 1 }
      }

      if (isBulkMode) {
        if (bulkCombinations.length === 0) {
          throw new Error('Chọn ít nhất một giá trị để tạo biến thể hàng loạt')
        }

        for (const combination of bulkCombinations) {
          const optionValues = formatCombinationOptionValues(combination)
          await adminProductApi.createVariant(productId, {
            ...payload,
            sku: generateAutoSKU(productName, optionValues),
            title: generateAutoTitle(productName, optionValues),
            option_values: optionValues,
          })
        }

        return { mode: 'bulk' as const, count: bulkCombinations.length }
      }

      await adminProductApi.createVariant(productId, payload)
      return { mode: 'create' as const, count: 1 }
    },
    onSuccess: (result) => {
      if (result.mode === 'bulk') {
        toast.success(`Đã tạo ${result.count} biến thể thành công!`)
      } else {
        toast.success(isEdit ? 'Cập nhật biến thể thành công!' : 'Thêm biến thể thành công!')
      }
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
        {!isEdit && (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Tạo hàng loạt theo tổ hợp</p>
                <p className="text-xs leading-5 text-slate-500">
                  Chọn nhiều màu, dung lượng hoặc RAM để hệ thống tự sinh toàn bộ biến thể.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkMode((current) => {
                    const next = !current

                    if (!next) {
                      setBulkSelections({})
                      setValue('sku', '')
                      setValue('title', '')
                      setValue('option_values', '')
                    }

                    return next
                  })
                }}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  isBulkMode
                    ? 'bg-cyan-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700',
                )}
              >
                {isBulkMode ? 'Đang bật tạo hàng loạt' : 'Bật tạo hàng loạt'}
              </button>
            </div>

            {isBulkMode && (
              <div className="mt-3 space-y-2 rounded-xl border border-cyan-100 bg-white/80 p-3">
                <p className="text-xs font-medium text-slate-600">
                  Sẽ tạo <span className="font-bold text-cyan-700">{bulkCombinations.length}</span> biến thể
                </p>
                {bulkCombinations.length > 0 && (
                  <div className="space-y-1 text-xs text-slate-500">
                    {bulkCombinations.slice(0, 6).map((combination, index) => (
                      <p key={`${formatCombinationOptionValues(combination)}-${index}`}>
                        {formatCombinationOptionValues(combination)}
                      </p>
                    ))}
                    {bulkCombinations.length > 6 && (
                      <p>... và thêm {bulkCombinations.length - 6} biến thể nữa</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SKU *" error={errors.sku?.message}>
            <input
              {...register('sku')}
              placeholder="SKU-001-L-BLACK"
              className={inputClass(!!errors.sku)}
              disabled={isBulkMode && !isEdit}
            />
          </Field>

          <Field label="Tiêu đề biến thể" error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="iPhone 15 Pro Max Đen 128GB"
              className={inputClass(!!errors.title)}
              disabled={isBulkMode && !isEdit}
            />
          </Field>

          <Field label="Phân loại *" error={errors.option_values?.message} className="md:col-span-2">
            <div className="mb-3 flex flex-col gap-3">
              {optionGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 w-20 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {group.label}:
                    </span>
                    {group.values.map((val) => {
                      const active = isOptionSelected(group.label, val)
                      const custom = isCustomQuickOption(group.label, val)
                      return (
                        <div key={`${group.label}-${val}`} className="group relative inline-flex">
                          <button
                            type="button"
                            onClick={() => appendOption(group.label, val)}
                            className={cn(
                              'rounded-full border px-2.5 py-1 pr-7 text-[11px] font-medium transition-all active:scale-95',
                              active
                                ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm shadow-cyan-100'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-400 hover:text-cyan-600',
                              !custom && 'pr-2.5',
                            )}
                          >
                            {val}
                          </button>
                          {custom && (
                            <button
                              type="button"
                              onClick={() => removeQuickOptionValue(group.label, val)}
                              className={cn(
                                'absolute right-2 top-1/2 -translate-y-1/2 text-[10px] transition-colors',
                                active ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-500',
                              )}
                              aria-label={`Xóa ${val}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 pl-[5.25rem]">
                    <input
                      type="text"
                      value={draftOptionValues[group.label] ?? ''}
                      onChange={(event) =>
                        setDraftOptionValues((current) => ({
                          ...current,
                          [group.label]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addQuickOptionValue(group.label)
                        }
                      }}
                      placeholder={`Thêm ${group.label.toLowerCase()}`}
                      className="h-8 w-full max-w-[220px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-600 outline-none transition focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => addQuickOptionValue(group.label)}
                      className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <textarea
              {...register('option_values')}
              rows={2}
              placeholder="Màu: Đen, Dung lượng: 128GB"
              className={cn(inputClass(!!errors.option_values), 'resize-none')}
              readOnly={isBulkMode && !isEdit}
            />
            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              {isBulkMode && !isEdit
                ? 'Chế độ hàng loạt sẽ tự tạo option_values cho từng tổ hợp từ các lựa chọn bên trên.'
                : 'Có thể nhập hoặc chọn từ gợi ý bên trên. Hệ thống sẽ tự lưu thành JSON hợp lệ.'}
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
          <Field label="Ảnh biến thể (Tùy chọn)" error={errors.thumbnail_url?.message}>
            <div className="space-y-3">
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-700">Tải ảnh mới</p>
                  <p className="text-[10px] text-slate-500">Nếu để trống, sẽ dùng ảnh mặc định của sản phẩm.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800">
                  {isUploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                  {isUploadingImage ? 'Đang tải...' : 'Chọn ảnh'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadImage(file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>

              {thumbnailUrl && (
                <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    <img src={thumbnailUrl} alt="Preview" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-[10px] text-slate-400">{thumbnailUrl}</p>
                    <button
                      type="button"
                      onClick={() => setValue('thumbnail_url', '', { shouldDirty: true, shouldValidate: true })}
                      className="inline-flex w-fit items-center gap-1 rounded-md text-[10px] font-bold text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Field>
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
