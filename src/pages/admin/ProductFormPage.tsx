import { type ReactNode, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  Clock3,
  Layers3,
  Package2,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Trash2,
} from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'
import { ProductForm } from '@/features/admin/products/ProductForm'
import { VariantForm } from '@/features/admin/products/VariantForm'

import { getErrorMessage } from '@/utils/httpError'
import { ROUTES } from '@/utils/constants'
import { formatDateTime, formatNumber, formatVND } from '@/utils/formatters/format'
import {
  formatVariantLabel,
  formatVariantOptionValues,
  getVariantPrice,
  getVariantStock,
  isVariantActive,
} from '@/utils/productVariant'
import { toast } from 'sonner'
import type { Product, ProductVariant } from '@/types/product.types'

const STATUS_META: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  draft: {
    label: 'Bản nháp',
    className: 'bg-slate-100 text-slate-600',
    dotClassName: 'bg-slate-400',
  },
  active: {
    label: 'Đang bán',
    className: 'bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  },
  inactive: {
    label: 'Ngừng bán',
    className: 'bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
  },
  archived: {
    label: 'Lưu trữ',
    className: 'bg-red-50 text-red-700',
    dotClassName: 'bg-red-500',
  },
}

export function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const productId = Number(id)
  const isEdit = !!id
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null)

  const detailQueryKey = Number.isFinite(productId)
    ? queryKeys.admin.products.detail(productId)
    : ['admin', 'products', 'detail', 'new'] as const

  const { data: product, isLoading, isFetching, refetch } = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => adminProductApi.getDetail(productId),
    enabled: isEdit && Number.isFinite(productId),
  })

  const { mutate: deleteVariant, isPending: isDeletingVariant } = useMutation({
    mutationFn: (variant: ProductVariant) => adminProductApi.deleteVariant(productId, variant.id),
    onSuccess: () => {
      toast.success('Xóa biến thể thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.all })
      qc.invalidateQueries({ queryKey: queryKeys.products.all })
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.history(productId) })
      qc.invalidateQueries({ queryKey: queryKeys.admin.products.detail(productId) })
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(productId) })
      setVariantToDelete(null)
      void refetch()
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể xóa biến thể')),
  })

  const openCreateVariant = () => {
    setSelectedVariant(null)
    setIsVariantModalOpen(true)
  }

  const openEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setIsVariantModalOpen(true)
  }

  const closeVariantModal = () => {
    setIsVariantModalOpen(false)
    setSelectedVariant(null)
  }

  const openDeleteVariant = (variant: ProductVariant) => {
    setVariantToDelete(variant)
  }

  const variants = product?.variants ?? []
  const totalVariants = variants.length
  const activeVariants = variants.filter((variant) => isVariantActive(variant)).length
  const lowStockVariants = variants.filter((variant) => {
    const stock = getVariantStock(variant) ?? 0
    return stock > 0 && stock <= 5
  }).length
  const outOfStockVariants = variants.filter((variant) => (getVariantStock(variant) ?? 0) === 0).length
  const totalStock = variants.reduce(
    (sum, variant) => sum + (getVariantStock(variant) ?? 0),
    0,
  )
  const activeRatio = totalVariants > 0 ? Math.round((activeVariants / totalVariants) * 100) : 0

  const categoryNames = product?.categories?.map((category) => category.name).filter(Boolean) ?? []
  const categoryLabel = categoryNames.length
    ? categoryNames.slice(0, 2).join(', ') + (categoryNames.length > 2 ? ` +${categoryNames.length - 2}` : '')
    : 'Chưa phân loại'

  const statusMeta = STATUS_META[product?.status ?? 'draft'] ?? STATUS_META.draft
  const isLoadingDetail = isEdit && isLoading
  const hasProduct = !!product
  const displayTitle = isEdit ? product?.name ?? 'Đang tải sản phẩm...' : 'Thêm sản phẩm mới'
  const displayDescription = isEdit
    ? 'Quản lý metadata, biến thể và lịch sử thay đổi trong một giao diện duy nhất.'
    : 'Nhập metadata trước, lưu sản phẩm, sau đó quay lại để mở khóa khu vực biến thể.'

  if (isEdit && !isLoadingDetail && !product) {
    return (
      <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="rounded-full bg-amber-50 p-4 text-amber-600">
            <TriangleAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-headline text-2xl font-bold text-slate-900">
              Không tìm thấy sản phẩm
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              Sản phẩm này có thể đã bị xóa hoặc ID không còn hợp lệ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
            className="rounded-2xl bg-gradient-to-r from-cyan-600 to-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            Quay lại danh sách sản phẩm
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl" />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-slate-200/60 blur-3xl" />
        <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 circuit-line opacity-20" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
              <span>Admin</span>
              <span>/</span>
              <span>Sản phẩm</span>
              <span>/</span>
              <span>Biến thể</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-cyan-200 hover:text-cyan-600"
                aria-label="Quay lại danh sách sản phẩm"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.35em] text-cyan-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Variant Control
                </div>
                <h1 className="mt-3 font-headline text-3xl font-bold text-slate-900 md:text-4xl">
                  {displayTitle}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {displayDescription}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={product ? statusMeta.label : 'Đang tải'}
                className={product ? statusMeta.className : 'bg-slate-100 text-slate-500'}
              />
              <StatusPill
                label={product?.is_published ? 'Đã công khai' : 'Chưa công khai'}
                className={product?.is_published ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-500'}
              />
              <StatusPill
                label={product?.is_coupon_eligible ? 'Hỗ trợ coupon' : 'Không hỗ trợ coupon'}
                className={product?.is_coupon_eligible ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
              />
              {isEdit && product && (
                <StatusPill
                  label={`#${product.id}`}
                  className="bg-slate-100 text-slate-600"
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isEdit && (
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-cyan-200 hover:text-cyan-700"
              >
                <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                Làm mới
              </button>
            )}

            {isEdit && (
              <button
                type="button"
                onClick={openCreateVariant}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus className="h-4 w-4" />
                Thêm biến thể
              </button>
            )}
          </div>
        </div>
      </section>

      {isLoadingDetail ? (
        <ProductFormPageSkeleton />
      ) : isEdit && hasProduct ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <section className="glass-panel overflow-hidden rounded-3xl border border-outline-variant/10 p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700">
                    <Layers3 className="h-3.5 w-3.5" />
                    Metadata
                  </div>
                  <h2 className="mt-4 font-headline text-xl font-bold text-slate-900">
                    Thông tin sản phẩm
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Cập nhật tên, slug, danh mục, giá gốc và cấu hình xuất bản.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  Cập nhật {formatDateTime(product.updated_at)}
                </div>
              </div>

              <ProductForm
                product={product}
                onSuccess={(newProduct) => {
                  if (!isEdit && newProduct) {
                    navigate(ROUTES.ADMIN_PRODUCT_EDIT(newProduct.id), { replace: true })
                    return
                  }

                  void refetch()
                }}
              />
            </section>

            <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700">
                    <Package2 className="h-3.5 w-3.5" />
                    Variants
                  </div>
                  <h2 className="mt-4 font-headline text-xl font-bold text-slate-900">
                    Biến thể sản phẩm
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Quản lý SKU, phân loại, giá ghi đè và tồn kho theo từng phiên bản.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    label={`${totalVariants} biến thể`}
                    className="bg-cyan-50 text-cyan-700"
                  />
                  <StatusPill
                    label={`${activeVariants} đang bán`}
                    className="bg-emerald-50 text-emerald-700"
                  />
                  <StatusPill
                    label={`${lowStockVariants} sắp hết`}
                    className="bg-amber-50 text-amber-700"
                  />
                  <StatusPill
                    label={`${outOfStockVariants} hết hàng`}
                    className="bg-red-50 text-red-700"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Tổng biến thể"
                  value={formatNumber(totalVariants)}
                  note="Toàn bộ dòng cấu hình"
                  icon={<Boxes className="h-5 w-5" />}
                  tone="bg-cyan-50 text-cyan-700"
                />
                <MetricCard
                  label="Đang bán"
                  value={formatNumber(activeVariants)}
                  note={`${activeRatio}% danh mục đang hoạt động`}
                  icon={<ShieldCheck className="h-5 w-5" />}
                  tone="bg-emerald-50 text-emerald-700"
                  progress={activeRatio}
                />
                <MetricCard
                  label="Sắp hết"
                  value={formatNumber(lowStockVariants)}
                  note="Tồn kho nhỏ hơn hoặc bằng 5"
                  icon={<TriangleAlert className="h-5 w-5" />}
                  tone="bg-amber-50 text-amber-700"
                />
                <MetricCard
                  label="Tổng tồn"
                  value={formatNumber(totalStock)}
                  note="Cộng tất cả biến thể"
                  icon={<BarChart3 className="h-5 w-5" />}
                  tone="bg-slate-100 text-slate-700"
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white">
                {variants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-slate-100 bg-surface-container-low/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Biến thể
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Phân loại
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            SKU
                          </th>
                          <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Giá
                          </th>
                          <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Kho
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Trạng thái
                          </th>
                          <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((variant) => {
                          const stock = getVariantStock(variant) ?? 0
                          const price = getVariantPrice(variant, product.min_price ?? 0)

                          return (
                            <tr key={variant.id} className="group border-b border-slate-50 transition-colors hover:bg-slate-50/80">
                              <td className="px-4 py-4 font-semibold text-slate-800">
                                {formatVariantLabel(variant)}
                              </td>
                              <td className="px-4 py-4 text-slate-500">
                                {formatVariantOptionValues(variant.option_values)}
                              </td>
                              <td className="px-4 py-4 font-mono text-xs text-slate-400">
                                {variant.sku}
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-medium text-slate-900">
                                {formatVND(price)}
                              </td>
                              <td className="px-4 py-4 text-right font-mono">
                                <span className={cn('font-semibold', stock === 0 ? 'text-red-500' : stock <= 5 ? 'text-amber-600' : 'text-slate-700')}>
                                  {formatNumber(stock)}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                    isVariantActive(variant)
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-100 text-slate-500',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full',
                                      isVariantActive(variant) ? 'bg-emerald-500' : 'bg-slate-400',
                                    )}
                                  />
                                  {isVariantActive(variant) ? 'Đang bán' : 'Đã ẩn'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditVariant(variant)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openDeleteVariant(variant)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <VariantEmptyState onOpenForm={openCreateVariant} />
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-slate-900">
                    Tổng quan nhanh
                  </h3>
                  <p className="text-sm text-slate-500">
                    Thông tin nền cho quản trị biến thể
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <DetailRow label="Mã sản phẩm" value={`#${product.id}`} />
                <DetailRow label="Slug" value={product.slug} mono />
                <DetailRow label="Danh mục" value={categoryLabel} />
                <DetailRow label="Thương hiệu" value={product.brand ?? 'Chưa có'} />
                <DetailRow label="Giá sản phẩm" value={formatVND(product.min_price ?? 0)} mono />
                <DetailRow label="Giá cuối" value={formatVND(product.final_price ?? product.min_price ?? 0)} mono />
                <DetailRow label="Tổng tồn" value={`${formatNumber(totalStock)} sản phẩm`} mono />
                <DetailRow label="Cập nhật" value={formatDateTime(product.updated_at)} />
              </div>

              <div className="mt-6 rounded-2xl bg-surface-container-low p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                    Hoạt động
                  </p>
                  <span className="text-xs font-semibold text-cyan-600">
                    {activeRatio}% active
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${Math.max(activeRatio, 8)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Tỉ lệ biến thể đang bán phản ánh chất lượng cấu hình và mức độ sẵn sàng của sản phẩm.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-primary p-6 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <ShieldCheck className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-100/80">
                    Inventory Signal
                  </p>
                  <h3 className="mt-2 font-headline text-xl font-bold">
                    {lowStockVariants > 0 ? 'Cần kiểm tra tồn kho' : 'Tồn kho ổn định'}
                  </h3>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-cyan-50/90">
                <p>
                  <span className="font-semibold text-white">{totalVariants}</span> biến thể đang được quản lý.
                </p>
                <p>
                  <span className="font-semibold text-white">{lowStockVariants}</span> biến thể sắp hết hàng.
                </p>
                <p>
                  <span className="font-semibold text-white">{outOfStockVariants}</span> biến thể đã hết hàng.
                </p>
              </div>
              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <TriangleAlert className="h-4 w-4 text-cyan-200" />
                  Gợi ý
                </div>
                <p className="mt-2 text-sm leading-6 text-cyan-50/90">
                  Ưu tiên tạo SKU rõ ràng, cấu trúc phân loại nhất quán và giữ `stock_quantity`
                  sát thực tế để tránh hết hàng ảo.
                </p>
              </div>
            </section>


          </aside>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <section className="glass-panel rounded-3xl border border-outline-variant/10 p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700">
                  <Layers3 className="h-3.5 w-3.5" />
                  Bước 1
                </div>
                <h2 className="mt-4 font-headline text-xl font-bold text-slate-900">
                  Thông tin sản phẩm
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Điền metadata cơ bản trước, sau đó sản phẩm mới mở khóa phần biến thể.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-xs font-semibold text-slate-500">
                Bước kế tiếp: Lưu sản phẩm để thêm biến thể
              </div>
            </div>

            <ProductForm
              product={product}
              onSuccess={(newProduct) => {
                if (!isEdit && newProduct) {
                  navigate(ROUTES.ADMIN_PRODUCT_EDIT(newProduct.id), { replace: true })
                  return
                }

                void refetch()
              }}
            />
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-slate-900">
                    Quy trình tạo biến thể
                  </h3>
                  <p className="text-sm text-slate-500">
                    Thiết kế theo luồng giống các trang admin còn lại
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <ProcessStep index="1" title="Nhập metadata" description="Tên, slug, danh mục, giá gốc và mô tả." />
                <ProcessStep index="2" title="Lưu sản phẩm" description="Tạo sản phẩm xong mới có ID để gắn biến thể." />
                <ProcessStep index="3" title="Mở form biến thể" description="Khi đã lưu, quay lại màn edit để thêm SKU và phân loại." />
              </div>
            </section>

            <section className="rounded-3xl bg-primary p-6 text-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-100/80">
                Quick Hint
              </p>
              <h3 className="mt-3 font-headline text-xl font-bold">
                Một sản phẩm có thể có nhiều biến thể
              </h3>
              <p className="mt-3 text-sm leading-6 text-cyan-50/90">
                Sau khi lưu, bạn có thể quản lý giá, tồn kho và trạng thái từng biến thể ngay trên
                chính trang này.
              </p>
            </section>
          </aside>
        </div>
      )}
      {isEdit && product && isVariantModalOpen && (
        <VariantModal
          product={product}
          variant={selectedVariant}
          onClose={closeVariantModal}
        />
      )}

      <ConfirmDialog
        open={!!variantToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setVariantToDelete(null)
          }
        }}
        title="Xóa biến thể"
        description={
          variantToDelete
            ? `Bạn có chắc muốn xóa biến thể ${formatVariantLabel(variantToDelete)} (${variantToDelete.sku})? Hành động này sẽ cập nhật lại giá và tồn kho của sản phẩm.`
            : 'Bạn có chắc muốn xóa biến thể này?'
        }
        onConfirm={() => {
          if (variantToDelete) {
            deleteVariant(variantToDelete)
          }
        }}
        confirmLabel="Xóa biến thể"
        loading={isDeletingVariant}
      />
    </div>
  )
}

function StatusPill({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.3em]',
        className,
      )}
    >
      {label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  note,
  icon,
  tone,
  progress,
}: {
  label: string
  value: string
  note: string
  icon: ReactNode
  tone: string
  progress?: number
}) {
  return (
    <div className="glass-panel group relative overflow-hidden rounded-2xl border border-outline-variant/10 p-5">
      <div className="absolute -right-3 -top-3 text-[84px] text-cyan-500/10">
        {icon}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className={cn('rounded-xl p-2.5', tone)}>{icon}</div>
        {typeof progress === 'number' && (
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
            {progress}%
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-headline text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>
      {typeof progress === 'number' && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{ width: `${Math.max(progress, 6)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
        {label}
      </span>
      <span
        className={cn(
          'max-w-[55%] truncate text-sm font-medium text-slate-700',
          mono && 'font-mono text-xs text-slate-500',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function VariantModal({
  product,
  variant,
  onClose,
}: {
  product: Product
  variant?: ProductVariant | null
  onClose: () => void
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const categoryNames = product.categories?.map((category) => category.name).filter(Boolean) ?? []
  const categoryLabel = categoryNames.length
    ? categoryNames.slice(0, 2).join(', ') + (categoryNames.length > 2 ? ` +${categoryNames.length - 2}` : '')
    : 'Chưa phân loại'
  const variantCount = product.variants?.length ?? 0
  const totalStock = (product.variants ?? []).reduce(
    (sum, variant) => sum + (getVariantStock(variant) ?? 0),
    0,
  )
  const statusMeta = STATUS_META[product.status ?? 'draft'] ?? STATUS_META.draft
  const isEditingVariant = !!variant
  const modalHeading = isEditingVariant ? 'Chỉnh sửa biến thể' : 'Thêm biến thể'
  const modalDescription = isEditingVariant
    ? `Cập nhật thông tin cho ${formatVariantLabel(variant)} của ${product.name}.`
    : `Tạo biến thể mới cho ${product.name}.`

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto flex h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-100 bg-surface-container-lowest shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-slate-200/60 blur-3xl" />

        <div className="relative grid h-full min-h-0 flex-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            <div className="mb-4 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700">
                <Package2 className="h-3.5 w-3.5" />
                {modalHeading}
              </div>
              <h2 className="font-headline text-2xl font-bold text-slate-900">
                {isEditingVariant
                  ? `Sửa biến thể: ${formatVariantLabel(variant)}`
                  : `Tạo biến thể cho ${product.name}`}
              </h2>
              <p className="text-sm leading-6 text-slate-500">
                {modalDescription}
              </p>
            </div>

            <VariantForm
              productId={product.id}
              productName={product.name}
              variant={variant ?? undefined}
              onClose={onClose}
            />
          </div>

          <aside className="hidden h-full min-h-0 overflow-y-auto border-l border-cyan-100/80 bg-gradient-to-br from-cyan-50/80 via-white to-slate-50 p-6 lg:flex lg:flex-col scrollbar-thin">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Quick Overview
            </div>

            <h3 className="mt-4 font-headline text-xl font-bold text-slate-900">
              {product.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Quản lý SKU, giá ghi đè, tồn kho và trạng thái ngay trong modal này.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill label={statusMeta.label} className={statusMeta.className} />
              <StatusPill
                label={product.is_published ? 'Đã công khai' : 'Chưa công khai'}
                className={product.is_published ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-500'}
              />
            </div>

            <div className="mt-6 space-y-4">
              <DetailRow label="Mã sản phẩm" value={`#${product.id}`} />
              <DetailRow label="Slug" value={product.slug} mono />
              <DetailRow label="Danh mục" value={categoryLabel} />
              <DetailRow label="Tổng biến thể" value={formatNumber(variantCount)} mono />
              <DetailRow label="Tổng tồn" value={formatNumber(totalStock)} mono />
              <DetailRow label="Giá sản phẩm" value={formatVND(product.min_price ?? 0)} mono />
              <DetailRow label="Giá cuối" value={formatVND(product.final_price ?? product.min_price ?? 0)} mono />
              <DetailRow label="Cập nhật" value={formatDateTime(product.updated_at)} />
            </div>

            <div className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Quy trình nhanh
              </p>
              <div className="mt-4 space-y-3">
                <ProcessStep
                  index="1"
                  title="Nhập SKU"
                  description="SKU phải duy nhất để backend lưu được biến thể."
                />
                <ProcessStep
                  index="2"
                  title="Điền phân loại"
                  description="Mô tả màu, size hoặc thuộc tính khác bằng option_values."
                />
                <ProcessStep
                  index="3"
                  title="Bấm lưu"
                  description="Form sẽ đóng và dữ liệu được refetch ngay trên trang."
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function VariantEmptyState({ onOpenForm }: { onOpenForm: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="rounded-full bg-cyan-50 p-4 text-cyan-700">
        <Package2 className="h-8 w-8" />
      </div>
      <div className="max-w-md space-y-2">
        <h3 className="font-headline text-xl font-bold text-slate-900">
          Chưa có biến thể nào
        </h3>
        <p className="text-sm leading-6 text-slate-500">
          Bắt đầu bằng SKU đầu tiên để hệ thống tính tồn kho, giá và trạng thái bán hàng.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenForm}
        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" />
        Thêm biến thể đầu tiên
      </button>
    </div>
  )
}

function ProcessStep({
  index,
  title,
  description,
}: {
  index: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-surface-container-low p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-cyan-700 shadow-sm">
        {index}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function ProductFormPageSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
      <div className="space-y-6">
        <div className="glass-panel animate-pulse rounded-3xl border border-outline-variant/10 p-6">
          <div className="space-y-4">
            <div className="h-3 w-40 rounded-full bg-slate-200" />
            <div className="h-10 w-3/5 rounded-full bg-slate-200" />
            <div className="h-4 w-4/5 rounded-full bg-slate-200" />
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-full bg-slate-200" />
              <div className="h-6 w-28 rounded-full bg-slate-200" />
              <div className="h-6 w-24 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm animate-pulse">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-4 h-8 w-8 rounded-xl bg-slate-200" />
                <div className="mb-2 h-3 w-24 rounded-full bg-slate-200" />
                <div className="mb-2 h-8 w-20 rounded-full bg-slate-200" />
                <div className="h-3 w-32 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6">
            <div className="space-y-3">
              <div className="h-4 w-48 rounded-full bg-slate-200" />
              <div className="h-4 w-72 rounded-full bg-slate-200" />
              <div className="h-4 w-56 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm animate-pulse">
          <div className="h-10 w-44 rounded-full bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-3/4 rounded-full bg-slate-200" />
            <div className="h-4 w-full rounded-full bg-slate-200" />
            <div className="h-4 w-5/6 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="rounded-3xl border border-outline-variant/10 bg-primary p-6 shadow-sm animate-pulse">
          <div className="h-4 w-28 rounded-full bg-white/20" />
          <div className="mt-3 h-8 w-4/5 rounded-full bg-white/20" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-3/4 rounded-full bg-white/20" />
            <div className="h-3 w-4/5 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm animate-pulse">
          <div className="h-10 w-52 rounded-full bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-3 w-full rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200" />
            <div className="h-3 w-3/4 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
