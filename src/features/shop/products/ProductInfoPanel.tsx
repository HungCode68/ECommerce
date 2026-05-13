import { Minus, Plus, Star } from 'lucide-react'
import { ProductPromotionBox } from './ProductPromotionBox'
import { cn } from '@/lib/utils'
import { formatVND } from '@/utils/formatters/format'
import type { Product } from '@/types/product.types'

type VariantGroup = {
  label: string
  values: string[]
}

type ProductInfoPanelProps = {
  product: Product
  rating: number
  ratingCount: number
  price: number
  originalPrice: number
  selectedAttributes: Record<string, string>
  variantGroups: VariantGroup[]
  onSelectAttribute: (label: string, value: string) => void
  qty: number
  onDecreaseQty: () => void
  onIncreaseQty: () => void
  buyNowLabel: string
  onBuyNow: () => void
  onAddToCart: () => void
  disableBuyNow?: boolean
  disableAddToCart?: boolean
}

const colorLabels = new Set(['mau', 'mau sac', 'color'])

function normalizeKey(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

const colorClassMap: Record<string, string> = {
  black: 'bg-black',
  den: 'bg-black',
  white: 'bg-white',
  trang: 'bg-white',
  silver: 'bg-slate-200',
  bac: 'bg-slate-200',
  gray: 'bg-slate-400',
  grey: 'bg-slate-400',
  xam: 'bg-slate-400',
  blue: 'bg-blue-500',
  xanh: 'bg-blue-500',
  'xanh duong': 'bg-blue-500',
  navy: 'bg-blue-900',
  green: 'bg-emerald-500',
  'xanh la': 'bg-emerald-500',
  'xanh lá': 'bg-emerald-500',
  purple: 'bg-violet-500',
  violet: 'bg-violet-500',
  tim: 'bg-violet-500',
  tím: 'bg-violet-500',
  gold: 'bg-amber-200',
  vang: 'bg-amber-200',
  vàng: 'bg-amber-200',
  yellow: 'bg-yellow-300',
  pink: 'bg-pink-400',
  hong: 'bg-pink-400',
  hồng: 'bg-pink-400',
  red: 'bg-red-500',
  do: 'bg-red-500',
  đỏ: 'bg-red-500',
}

function getColorClass(value: string) {
  const normalized = normalizeKey(value)
  if (colorClassMap[normalized]) return colorClassMap[normalized]

  if (normalized.includes('den')) return 'bg-black'
  if (normalized.includes('trang')) return 'bg-white'
  if (normalized.includes('bac') || normalized.includes('silver')) return 'bg-slate-200'
  if (normalized.includes('xam') || normalized.includes('gray') || normalized.includes('grey')) return 'bg-slate-400'
  if (normalized.includes('vang') || normalized.includes('gold')) return 'bg-amber-200'
  if (normalized.includes('xanh la') || normalized.includes('green')) return 'bg-emerald-500'
  if (normalized.includes('xanh') || normalized.includes('blue')) return 'bg-blue-500'
  if (normalized.includes('tim') || normalized.includes('violet') || normalized.includes('purple')) return 'bg-violet-500'
  if (normalized.includes('hong') || normalized.includes('pink')) return 'bg-pink-400'
  if (normalized.includes('do') || normalized.includes('red')) return 'bg-red-500'

  return 'bg-slate-300'
}

export function ProductInfoPanel({
  product,
  rating,
  ratingCount,
  price,
  originalPrice,
  selectedAttributes,
  variantGroups,
  onSelectAttribute,
  qty,
  onDecreaseQty,
  onIncreaseQty,
  buyNowLabel,
  onBuyNow,
  onAddToCart,
  disableBuyNow,
  disableAddToCart,
}: ProductInfoPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {product.brand ? (
          <span className="inline-flex rounded-full bg-[#630ed4]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#630ed4]">
            {product.brand}
          </span>
        ) : null}
        <h1 className="text-3xl font-bold leading-tight text-[#1c1b1b] md:text-4xl">{product.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#4a4455]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-current text-amber-400" />
            {rating > 0 ? rating.toFixed(1) : '0.0'}
          </span>
          <span>{ratingCount} đánh giá</span>
          {typeof product.stock === 'number' ? (
            <span>{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}</span>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[#ccc3d8] bg-white p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-full bg-[#ba1a1a] px-2 py-1 text-xs font-semibold text-white">
            -{product.discount_percent || 0}%
          </span>
          <span className="text-sm text-[#4a4455]">Giá tốt hôm nay</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold text-[#630ed4]">{formatVND(price)}</span>
          {originalPrice > price ? (
            <span className="text-base text-[#4a4455] line-through">{formatVND(originalPrice)}</span>
          ) : null}
        </div>
      </div>

      {variantGroups.length > 0 ? (
        <div className="space-y-5 rounded-2xl border border-[#ccc3d8] bg-white p-5">
          {variantGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#1c1b1b]">{group.label}</p>
                {selectedAttributes[group.label] ? (
                  <span className="text-sm text-[#4a4455]">{selectedAttributes[group.label]}</span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => {
                  const isSelected = selectedAttributes[group.label] === value
                  const colorClass = getColorClass(value)

                  return colorLabels.has(normalizeKey(group.label)) ? (
                    <button
                      key={`${group.label}-${value}`}
                      type="button"
                      onClick={() => onSelectAttribute(group.label, value)}
                      title={value}
                      className={cn(
                        'h-8 w-8 rounded-full border transition',
                        colorClass,
                        colorClass === 'bg-white' ? 'border-[#b9b1c7]' : 'border-transparent',
                        isSelected ? 'ring-2 ring-[#630ed4] ring-offset-2' : 'hover:ring-1 hover:ring-[#d2bbff]',
                      )}
                    >
                      <span className="sr-only">{value}</span>
                    </button>
                  ) : (
                    <button
                      key={`${group.label}-${value}`}
                      type="button"
                      onClick={() => onSelectAttribute(group.label, value)}
                      className={cn(
                        'rounded-full border px-3 py-2 text-sm transition',
                        isSelected
                          ? 'border-[#630ed4] bg-[#630ed4]/5 text-[#630ed4]'
                          : 'border-[#ccc3d8] text-[#4a4455] hover:border-[#630ed4] hover:text-[#630ed4]',
                      )}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#ccc3d8] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1c1b1b]">Số lượng</p>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className="flex items-center overflow-hidden rounded-xl border border-[#ccc3d8]">
            <button type="button" onClick={onDecreaseQty} className="px-3 py-2 text-[#4a4455]">
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-12 px-3 text-center text-sm font-semibold text-[#1c1b1b]">{qty}</span>
            <button type="button" onClick={onIncreaseQty} className="px-3 py-2 text-[#4a4455]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onBuyNow}
            disabled={disableBuyNow}
            className="rounded-xl bg-[#630ed4] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mua ngay
          </button>
          <button
            type="button"
            onClick={onAddToCart}
            disabled={disableAddToCart}
            className="rounded-xl border border-[#630ed4] bg-white px-4 py-3 text-sm font-semibold text-[#630ed4] transition hover:bg-[#630ed4]/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buyNowLabel}
          </button>
        </div>
      </div>

      <ProductPromotionBox />
    </div>
  )
}
