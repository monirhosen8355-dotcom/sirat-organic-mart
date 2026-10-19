import { Link } from 'react-router-dom'
import type { HomeBanner } from '../../types'

interface PromoBannerStripProps {
  banners: HomeBanner[]
}

const PromoBannerStrip = ({ banners }: PromoBannerStripProps) => {
  if (banners.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {banners.slice(0, 3).map((banner) => {
        const image = (
          <img
            src={banner.imageUrl}
            alt={banner.altText}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )

        return (
          <div
            key={banner.id}
            className="group relative h-44 overflow-hidden rounded-card shadow-banner md:h-56"
          >
            {banner.linkUrl ? (
              <Link to={banner.linkUrl} className="block h-full w-full">
                {image}
              </Link>
            ) : (
              image
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PromoBannerStrip