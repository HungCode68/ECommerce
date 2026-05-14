import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductImage } from '@/components/shared/ProductImage'
import { cn } from '@/lib/utils'

type ProductGalleryProps = {
  name: string
  items: { image: string; label?: string }[]
  activeImage?: string | null
  onImageChange: (item: { image: string; label?: string }) => void
}

export function ProductGallery({
  name,
  items,
  activeImage,
  onImageChange,
}: ProductGalleryProps) {
  const images = items.map((item) => item.image)
  const mainImage = activeImage || images[0] || null
  const currentIndex = mainImage ? images.indexOf(mainImage) : -1
  const activeItem = items.find((item) => item.image === mainImage) ?? items[0] ?? null

  const goPrevious = () => {
    if (images.length <= 1 || currentIndex < 0) return
    const nextIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    onImageChange(items[nextIndex])
  }

  const goNext = () => {
    if (images.length <= 1 || currentIndex < 0) return
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1
    onImageChange(items[nextIndex])
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#ccc3d8] bg-white p-4">
        <div className="flex min-h-[320px] items-center justify-center rounded-xl bg-[#f6f3f2] p-4 md:min-h-[520px]">
          <ProductImage
            src={mainImage}
            alt={name}
            className="h-full w-full"
            imgClassName="h-full max-h-[480px] w-full object-contain transition-transform duration-300 hover:scale-105"
          />
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#4a4455] shadow-sm transition hover:bg-white"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#4a4455] shadow-sm transition hover:bg-white"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item, index) => (
            <button
              key={`${item.image}-${index}`}
              type="button"
              onClick={() => onImageChange(item)}
              title={item.label || `${name} ${index + 1}`}
              className={cn(
                'w-20 shrink-0 overflow-hidden rounded-xl border bg-white p-2 transition md:w-24',
                item.image === activeItem?.image
                  ? 'border-[#630ed4] shadow-[0_0_0_1px_rgba(99,14,212,0.16)]'
                  : 'border-[#ccc3d8] hover:border-[#630ed4]',
              )}
            >
              <div className="aspect-square rounded-lg bg-[#f6f3f2]">
                <ProductImage
                  src={item.image}
                  alt={`${name} ${index + 1}`}
                  className="h-full w-full"
                  imgClassName="h-full w-full object-contain"
                />
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
