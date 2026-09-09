import { useState } from 'react'
import { getDetailImageUrl, getThumbnailUrl } from '../../lib/cloudinary/transform'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeImages = images.length > 0 ? images : ['']

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        {safeImages[activeIndex] ? (
          <img
            src={getDetailImageUrl(safeImages[activeIndex])}
            alt={`${productName} — ছবি ${activeIndex + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[color:var(--color-text-secondary)]">
            কোনো ছবি নেই
          </div>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {safeImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              aria-label={`ছবি ${index + 1} দেখুন`}
              className={[
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2',
                index === activeIndex
                  ? 'border-[color:var(--color-emerald)]'
                  : 'border-transparent',
              ].join(' ')}
            >
              <img
                src={getThumbnailUrl(img)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery