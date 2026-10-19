import { Link } from 'react-router-dom'
import type { HomeBanner } from '../../types'

interface PromoBannerGridProps {
  banners: HomeBanner[]
}

// প্রতিটা স্লট-এর জন্য desktop-এ grid position — mobile-এ এগুলো প্রযোজ্য হয় না,
// তখন সব ব্যানার সাধারণভাবে একটার নিচে একটা স্ট্যাক হয়ে যায়।
const SLOT_CLASSES = [
  'md:col-start-1 md:row-span-2', // ১ম — বড়, বাম দিকে, পুরো উচ্চতা জুড়ে
  'md:col-start-2 md:row-start-1', // ২য় — মাঝখানে উপরে
  'md:col-start-2 md:row-start-2', // ৩য় — মাঝখানে নিচে
  'md:col-start-3 md:row-span-2', // ৪র্থ — বড়, ডান দিকে, পুরো উচ্চতা জুড়ে
]

const PromoBannerGrid = ({ banners }: PromoBannerGridProps) => {
  if (banners.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 md:h-[420px] md:grid-cols-3 md:grid-rows-2">
      {banners.slice(0, 4).map((banner, index) => {
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
            className={`group relative h-40 overflow-hidden rounded-card shadow-banner md:h-auto ${SLOT_CLASSES[index] ?? ''}`}
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

export default PromoBannerGrid