import { useRef, useState } from 'react'
import { getDetailImageUrl, getThumbnailUrl } from '../../lib/cloudinary/transform'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

interface PointerPosition {
  x: number
  y: number
}

const MAX_ZOOM = 3

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const safeImages = images.filter(Boolean).slice(0, 4)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [zoomOrigin, setZoomOrigin] = useState<PointerPosition>({ x: 50, y: 50 })
  const pointers = useRef(new Map<number, PointerPosition>())
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)

  const activeImage = safeImages[activeIndex]

  const updateZoomOrigin = (event: { clientX: number; clientY: number; currentTarget: HTMLDivElement }) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setZoomOrigin({
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    })
  }

  const getPointerDistance = () => {
    const [first, second] = [...pointers.current.values()]
    if (!first || !second) return 0
    return Math.hypot(second.x - first.x, second.y - first.y)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)

    if (pointers.current.size === 2) {
      pinchStart.current = { distance: getPointerDistance(), zoom }
    } else if (event.pointerType === 'touch') {
      updateZoomOrigin(event)
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && !pointers.current.has(event.pointerId)) {
      updateZoomOrigin(event)
      setZoom(MAX_ZOOM)
      return
    }

    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size >= 2 && pinchStart.current) {
      const distance = getPointerDistance()
      if (distance > 0) {
        setZoom(Math.max(1, Math.min(MAX_ZOOM, pinchStart.current.zoom * (distance / pinchStart.current.distance))))
      }
      return
    }

    updateZoomOrigin(event)
    if (event.pointerType === 'mouse') setZoom(MAX_ZOOM)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    pinchStart.current = null
    if (pointers.current.size === 0 && event.pointerType === 'mouse') setZoom(1)
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    updateZoomOrigin(event)
    setZoom((current) => Math.max(1, Math.min(MAX_ZOOM, current - event.deltaY * 0.0025)))
  }

  const selectImage = (index: number) => {
    setActiveIndex(index)
    setZoom(1)
    setZoomOrigin({ x: 50, y: 50 })
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_30px_80px_rgba(16,24,40,0.08)] lg:aspect-[4/5]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setZoom(1)
        }}
        onWheel={handleWheel}
        aria-label={`Product image viewer for ${productName}`}
      >
        {activeImage ? (
          <img
            src={getDetailImageUrl(activeImage)}
            alt={`${productName} image ${activeIndex + 1}`}
            draggable={false}
            className="h-full w-full select-none object-contain transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-text-secondary)]">
            No image available
          </div>
        )}
      </div>

      {safeImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={() => selectImage(index)}
              aria-label={`View ${productName} image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={[
                'relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition-all duration-200',
                index === activeIndex
                  ? 'border-[color:var(--color-emerald)] shadow-md shadow-emerald-100'
                  : 'border-gray-200 opacity-80 hover:border-emerald-200 hover:opacity-100',
              ].join(' ')}
            >
              <img
                src={getThumbnailUrl(img)}
                alt={`${productName} thumbnail ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery