import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { HomeBanner } from '../../types'

interface HeroBannerCarouselProps {
  banners: HomeBanner[]
  intervalMs?: number
}

const HeroBannerCarousel = ({ banners, intervalMs = 3000 }: HeroBannerCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const isPaused = useRef(false)

  // কয়েক সেকেন্ড পর পর অটো-স্লাইড — হোভার/টাচ করলে থেমে যায়
  useEffect(() => {
    if (banners.length <= 1) return

    const timer = setInterval(() => {
      if (!isPaused.current) {
        setActiveIndex((prev) => (prev + 1) % banners.length)
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [banners.length, intervalMs])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    isPaused.current = true
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const SWIPE_THRESHOLD = 40

    if (deltaX > SWIPE_THRESHOLD) {
      setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)
    } else if (deltaX < -SWIPE_THRESHOLD) {
      setActiveIndex((prev) => (prev + 1) % banners.length)
    }
    touchStartX.current = null
    isPaused.current = false
  }

  if (banners.length === 0) return null

  return (
    <div
      className="relative overflow-hidden rounded-card shadow-banner"
      onMouseEnter={() => {
        isPaused.current = true
      }}
      onMouseLeave={() => {
        isPaused.current = false
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-32 w-full md:h-80">
        {banners.map((banner, index) => {
          const isActive = index === activeIndex
          const hasOverlayText = !!(banner.title || banner.subtitle || banner.ctaText)

          const slideContent = (
            <>
              <img
                src={banner.imageUrl}
                alt={banner.altText}
                loading={index === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
              />
              {hasOverlayText && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
                  <div className="absolute inset-0 flex items-end p-4 md:p-8">
                    <div className="max-w-md text-white">
                      {banner.title && (
                        <h1 className="mb-1.5 text-lg font-bold md:text-3xl">{banner.title}</h1>
                      )}
                      {banner.subtitle && (
                        <p className="mb-2 text-xs text-white/90 md:text-base">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.ctaText && (
                        <span className="inline-flex h-8 items-center justify-center rounded-button border border-white/50 bg-white/10 px-3 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20 md:h-10 md:px-4 md:text-sm">
                          {banner.ctaText}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )

          return (
            <div
              key={banner.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              {banner.linkUrl ? (
                <Link to={banner.linkUrl} className="relative block h-full w-full">
                  {slideContent}
                </Link>
              ) : (
                <div className="relative h-full w-full">{slideContent}</div>
              )}
            </div>
          )
        })}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${index + 1} নম্বর ব্যানার দেখুন`}
              aria-current={index === activeIndex}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroBannerCarousel