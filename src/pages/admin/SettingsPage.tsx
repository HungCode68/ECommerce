import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, LayoutTemplate, Loader2, MonitorSmartphone, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminBannerApi } from '@/api/admin/adminBanner.api'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/utils/httpError'
import type { Banner } from '@/types/banner.types'

type BannerSlot = {
  key: string
  label: string
  description: string
  position: string
  sort_order: number
}

type SlotDraft = {
  id?: number
  title: string
  image_url: string
  mobile_image_url: string
  link_url: string
  is_active: boolean
}

const BANNER_SLOTS: BannerSlot[] = [
  {
    key: 'home_hero_1',
    label: 'Banner trang chủ 1',
    description: 'Banner đầu tiên ngoài trang chủ. Dùng ảnh ngang lớn để khách nhìn thấy ngay.',
    position: 'home_hero',
    sort_order: 1,
  },
  {
    key: 'home_hero_2',
    label: 'Banner trang chủ 2',
    description: 'Banner thứ hai ngoài trang chủ, thường đặt bên cạnh banner 1.',
    position: 'home_hero',
    sort_order: 2,
  },
  {
    key: 'top_strip_1',
    label: 'Thanh ưu đãi trên cùng',
    description: 'Dùng cho khuyến mãi mảnh ở đầu trang, nội dung ngắn và dễ đọc.',
    position: 'top_strip',
    sort_order: 1,
  },
  {
    key: 'products_promo_1',
    label: 'Banner trang sản phẩm',
    description: 'Hiển thị ở trang danh sách sản phẩm hoặc chiến dịch đang chạy.',
    position: 'products_promo',
    sort_order: 1,
  },
]

const emptySlotDraft = (): SlotDraft => ({
  title: '',
  image_url: '',
  mobile_image_url: '',
  link_url: '',
  is_active: true,
})

function makeDraftFromBanner(banner?: Banner): SlotDraft {
  if (!banner) {
    return emptySlotDraft()
  }

  return {
    id: banner.id,
    title: banner.title,
    image_url: banner.image_url,
    mobile_image_url: banner.mobile_image_url ?? '',
    link_url: banner.link_url ?? '',
    is_active: banner.is_active,
  }
}

export function SettingsPage() {
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const [slotDrafts, setSlotDrafts] = useState<Record<string, SlotDraft>>({})
  const [uploadingSlotKey, setUploadingSlotKey] = useState<string | null>(null)
  const [uploadingMobileSlotKey, setUploadingMobileSlotKey] = useState<string | null>(null)
  const [savingSlotKey, setSavingSlotKey] = useState<string | null>(null)

  const { data: bannersData, isLoading } = useQuery({
    queryKey: queryKeys.admin.banners.list,
    queryFn: adminBannerApi.getAll,
  })
  const banners = Array.isArray(bannersData) ? bannersData : []

  const bannersBySlot = useMemo(() => {
    return BANNER_SLOTS.reduce<Record<string, Banner | undefined>>((acc, slot) => {
      acc[slot.key] = banners
        .filter((banner) => banner.position === slot.position && banner.sort_order === slot.sort_order)
        .sort((a, b) => b.id - a.id)[0]
      return acc
    }, {})
  }, [banners])
  const activeSlotKey = searchParams.get('slot')

  useEffect(() => {
    const nextDrafts = BANNER_SLOTS.reduce<Record<string, SlotDraft>>((acc, slot) => {
      acc[slot.key] = makeDraftFromBanner(bannersBySlot[slot.key])
      return acc
    }, {})
    setSlotDrafts(nextDrafts)
  }, [bannersBySlot])

  useEffect(() => {
    if (!activeSlotKey) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const element = document.querySelector<HTMLElement>(`[data-slot-key="${activeSlotKey}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [activeSlotKey, slotDrafts])

  const invalidateBannerQueries = () => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.banners.all })
    qc.invalidateQueries({ queryKey: queryKeys.banners.all })
  }

  const { mutate: uploadImage } = useMutation({
    mutationFn: (file: File) => adminProductApi.uploadImage(file),
    onSuccess: (url) => {
      if (uploadingSlotKey) {
        setSlotDrafts((current) => ({
          ...current,
          [uploadingSlotKey]: {
            ...current[uploadingSlotKey],
            image_url: url,
          },
        }))
        toast.success('Đã tải ảnh banner')
      }

      if (uploadingMobileSlotKey) {
        setSlotDrafts((current) => ({
          ...current,
          [uploadingMobileSlotKey]: {
            ...current[uploadingMobileSlotKey],
            mobile_image_url: url,
          },
        }))
        toast.success('Đã tải ảnh mobile')
      }

      setUploadingSlotKey(null)
      setUploadingMobileSlotKey(null)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể tải ảnh banner'))
      setUploadingSlotKey(null)
      setUploadingMobileSlotKey(null)
    },
  })

  const { mutate: saveSlotBanner } = useMutation({
    mutationFn: async (slot: BannerSlot) => {
      const draft = slotDrafts[slot.key]
      if (!draft) {
        throw new Error('Thiếu dữ liệu banner')
      }

      const payload = {
        title: draft.title.trim() || slot.label,
        image_url: draft.image_url,
        mobile_image_url: draft.mobile_image_url || undefined,
        link_url: draft.link_url || undefined,
        position: slot.position,
        sort_order: slot.sort_order,
        is_active: draft.is_active,
      }

      return draft.id
        ? adminBannerApi.update(draft.id, payload)
        : adminBannerApi.create(payload)
    },
    onSuccess: () => {
      toast.success('Đã lưu banner')
      setSavingSlotKey(null)
      invalidateBannerQueries()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể lưu banner'))
      setSavingSlotKey(null)
    },
  })

  const { mutate: deleteSlotBanner } = useMutation({
    mutationFn: async (slot: BannerSlot) => {
      const existingBanner = bannersBySlot[slot.key]
      if (!existingBanner) {
        return
      }
      await adminBannerApi.delete(existingBanner.id)
    },
    onSuccess: () => {
      toast.success('Đã xóa banner')
      invalidateBannerQueries()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể xóa banner'))
    },
  })

  const setDraftValue = (slotKey: string, updater: (draft: SlotDraft) => SlotDraft) => {
    setSlotDrafts((current) => ({
      ...current,
      [slotKey]: updater(current[slotKey] ?? emptySlotDraft()),
    }))
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý banner cực đơn giản</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Mỗi ô bên dưới là một vị trí banner cố định ngoài website. Admin chỉ cần chọn ảnh, nhập link nếu muốn rồi bấm lưu. Không cần nhớ position hay sort order nữa.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Tổng ô banner" value={BANNER_SLOTS.length} />
            <StatCard label="Đã có ảnh" value={BANNER_SLOTS.filter((slot) => bannersBySlot[slot.key]?.image_url).length} />
            <StatCard label="Đang hiển thị" value={BANNER_SLOTS.filter((slot) => bannersBySlot[slot.key]?.is_active).length} />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-full bg-slate-100 p-2 text-slate-600">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Các ô banner cố định</h2>
            <p className="text-sm text-slate-500">Làm theo từng ô, không cần thao tác kỹ thuật</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-sm text-slate-500">Đang tải banner...</div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {BANNER_SLOTS.map((slot) => {
              const draft = slotDrafts[slot.key] ?? emptySlotDraft()
              const isUploadingDesktop = uploadingSlotKey === slot.key
              const isUploadingMobile = uploadingMobileSlotKey === slot.key
              const isSavingThisSlot = savingSlotKey === slot.key
              const hasExistingBanner = Boolean(draft.id)

              return (
                <article
                  key={slot.key}
                  data-slot-key={slot.key}
                  className={cn(
                    'overflow-hidden rounded-[24px] border bg-slate-50 transition',
                    activeSlotKey === slot.key
                      ? 'border-cyan-400 ring-4 ring-cyan-100'
                      : 'border-slate-200',
                  )}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{slot.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{slot.description}</p>
                    </div>
                    <span className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                      draft.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600',
                    )}>
                      {draft.is_active ? 'active' : 'inactive'}
                    </span>
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="aspect-[21/8] w-full overflow-hidden bg-slate-100">
                        {draft.image_url ? (
                          <img src={draft.image_url} alt={draft.title || slot.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <div className="text-center">
                              <LayoutTemplate className="mx-auto h-10 w-10" />
                              <p className="mt-3 text-sm font-medium">Chưa có ảnh banner</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <UploadBox
                        title="Ảnh desktop"
                        subtitle="Ảnh ngang cho máy tính"
                        loading={isUploadingDesktop}
                        onPick={(file) => {
                          setUploadingSlotKey(slot.key)
                          uploadImage(file)
                        }}
                      />
                      <UploadBox
                        title="Ảnh mobile"
                        subtitle="Tùy chọn, nếu muốn mobile riêng"
                        loading={isUploadingMobile}
                        onPick={(file) => {
                          setUploadingMobileSlotKey(slot.key)
                          uploadImage(file)
                        }}
                      />
                    </div>

                    {draft.mobile_image_url && (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          <MonitorSmartphone className="h-4 w-4" />
                          Preview mobile
                        </div>
                        <img src={draft.mobile_image_url} alt={`${slot.label} mobile`} className="aspect-[4/3] w-full object-cover" />
                      </div>
                    )}

                    <Field label="Tên banner">
                      <input
                        value={draft.title}
                        onChange={(e) => setDraftValue(slot.key, (current) => ({ ...current, title: e.target.value }))}
                        className={inputClass}
                        placeholder="Ví dụ: iPhone 17 Pro Max"
                      />
                    </Field>

                    <Field label="Link khi người dùng bấm vào banner">
                      <input
                        value={draft.link_url}
                        onChange={(e) => setDraftValue(slot.key, (current) => ({ ...current, link_url: e.target.value }))}
                        className={inputClass}
                        placeholder="/san-pham hoặc https://..."
                      />
                    </Field>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.is_active}
                        onChange={(e) => setDraftValue(slot.key, (current) => ({ ...current, is_active: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Hiển thị banner này ngoài website
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={isSavingThisSlot || isUploadingDesktop || !draft.image_url}
                        onClick={() => {
                          setSavingSlotKey(slot.key)
                          saveSlotBanner(slot)
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingThisSlot && <Loader2 className="h-4 w-4 animate-spin" />}
                        {hasExistingBanner ? 'Cập nhật ô banner' : 'Lưu ô banner'}
                      </button>

                      {hasExistingBanner ? (
                        <button
                          type="button"
                          onClick={() => deleteSlotBanner(slot)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSlotDrafts((current) => ({ ...current, [slot.key]: emptySlotDraft() }))}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function UploadBox({
  title,
  subtitle,
  loading,
  onPick,
}: {
  title: string
  subtitle: string
  loading: boolean
  onPick: (file: File) => void
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 transition hover:border-cyan-300 hover:bg-cyan-50/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {title}
      </div>
      <p className="text-xs leading-5 text-slate-500">{subtitle}</p>
      <span className="inline-flex w-fit rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
        {loading ? 'Đang tải...' : 'Chọn ảnh'}
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onPick(file)
          }
          e.target.value = ''
        }}
      />
    </label>
  )
}

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100'
