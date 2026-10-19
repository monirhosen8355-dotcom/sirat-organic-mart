import { Link } from 'react-router-dom'
import { Star, Heart } from 'lucide-react'
import { useWishlist } from '../../lib/wishlist/useWishlist'
import type { Product } from '../../types'
import { getThumbnailUrl } from '../../lib/cloudinary/transform'
import { track } from '../../lib/analytics/track'
import Card from '../common/Card'
import Badge from '../common/Badge'

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { isFavorite, toggleFavorite } = useWishlist()
  const favorite = isFavorite(product.id)

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  const hasDiscount =
    product.type !== 'affiliate' &&
    product.price !== undefined &&
    !!product.discountPrice &&
    product.discountPrice < product.price
  const displayPrice = hasDiscount ? product.discountPrice : product.price
  const discountPercent = hasDiscount && product.price !== undefined && product.discountPrice !== undefined
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0
  const inStock = product.type === 'affiliate' || (product.stock ?? 0) > 0
  const hasRating = !!product.rating && product.rating > 0

  const card = (
    <Card hoverable padded={false} className="overflow-hidden">
        <div className="relative aspect-square w-full overflow-hidden bg-[color:var(--color-natural-bg)] p-3">
          <img
            src={getThumbnailUrl(product.images[0] ?? '')}
            alt={product.name}
            loading="lazy"
            className="h-full w-full rounded-card object-contain"
          />
          {hasDiscount && (
            <Badge variant="sale" className="absolute left-2 top-2">
              {discountPercent}% ছাড়
            </Badge>
          )}
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={favorite ? 'পছন্দের তালিকা থেকে সরান' : 'পছন্দের তালিকায় যোগ করুন'}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105"
          >
            <Heart
              className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
            />
          </button>
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Badge variant="danger">স্টক শেষ</Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="mb-1.5 line-clamp-2 text-base font-medium text-[color:var(--color-text-primary)]">
            {product.name}
          </h3>

          {hasRating && (
            <div className="mb-2 flex items-center gap-1">
              <div className="flex" aria-label={`${product.rating!.toFixed(1)} এর মধ্যে ৫`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round(product.rating!)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              {!!product.reviewCount && (
                <span className="text-sm text-[color:var(--color-text-secondary)]">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {displayPrice !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[color:var(--color-deep-green)]">
                {product.priceCurrency ? `${product.priceCurrency} ` : '৳'}{displayPrice}
              </span>
              {hasDiscount && (
                <span className="text-sm text-[color:var(--color-text-secondary)] line-through">
                  ৳{product.price}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
  )

  if (product.type === 'affiliate' && product.affiliateUrl) {
    return (
      <a
        href={product.affiliateUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        onClick={() => track('AffiliateClick', {
          content_ids: [product.id],
          content_name: product.name,
        })}
      >
        {card}
      </a>
    )
  }

  return <Link to={`/product/${product.slug}`}>{card}</Link>
}

export default ProductCard