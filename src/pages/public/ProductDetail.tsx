import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShoppingCart,
  Zap,
  Star,
  PackageCheck,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getProductBySlug } from '../../services/products/productService'
import { getApprovedReviews, submitReview } from '../../services/reviews/reviewService'
import type { Product, Review } from '../../types'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import ImageGallery from '../../components/product/ImageGallery'
import QuantitySelector from '../../components/product/QuantitySelector'
import RelatedProducts from '../../components/product/RelatedProducts'
import ReviewList from '../../components/common/ReviewList'
import ReviewForm from '../../components/common/ReviewForm'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { ProductDetailSkeleton } from '../../components/common/Skeleton'
import { track } from '../../lib/analytics/track'

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)
  const { user } = useAuthStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showStickyActions, setShowStickyActions] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    setQuantity(1)

    getProductBySlug(slug)
      .then(async (p) => {
        if (cancelled) return
        if (!p) {
          setNotFound(true)
          return
        }
        setProduct(p)
        track('ViewContent', {
          content_ids: [p.id],
          content_name: p.name,
          ...(p.price !== undefined
            ? { value: p.discountPrice ?? p.price, currency: p.priceCurrency ?? 'BDT' }
            : {}),
        })
        const productReviews = await getApprovedReviews(p.id)
        if (!cancelled) setReviews(productReviews)
      })
      .catch((err) => {
        if (!cancelled) {
          setError('There was a problem loading the product. Please try again.')
          console.error(err)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    const actionsElement = actionsRef.current
    if (!actionsElement) return

    const updateStickyVisibility = () => {
      const bounds = actionsElement.getBoundingClientRect()
      const isOriginalActionsVisible =
        bounds.bottom > 0 && bounds.top < window.innerHeight

      setShowStickyActions(!isOriginalActionsVisible)
    }

    updateStickyVisibility()
    window.addEventListener('scroll', updateStickyVisibility, { passive: true })
    window.addEventListener('resize', updateStickyVisibility)

    return () => {
      window.removeEventListener('scroll', updateStickyVisibility)
      window.removeEventListener('resize', updateStickyVisibility)
    }
  }, [product])

  const featureList = useMemo(() => {
    if (!product) return []

    const rawText = product.fullDescription || product.shortDescription
    const lines = rawText
      .split(/\n|•|\u2022|\r/)
      .map((line) => line.replace(/^[\s\-*>]+/, '').trim())
      .filter((line) => line.length > 2)

    if (lines.length === 0) {
      return [
        'Farm-fresh sourcing and quality selection',
        'Carefully packed to preserve freshness',
        'Made for healthy everyday living',
      ]
    }

    return lines.slice(0, 4)
  }, [product])

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!product) return
    if (!user) {
      toast.error('Please log in to leave a review')
      navigate('/login')
      return
    }
    await submitReview(product.id, {
      userId: user.uid,
      userName: user.displayName || 'Customer',
      rating,
      comment,
    })
  }

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-[color:var(--color-text-secondary)]">This product could not be found.</p>
        <Link to="/shop" className="text-[color:var(--color-emerald)] underline">
          Return to shop
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="py-16 text-center text-red-600">{error}</p>
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
  const inStock = product.type !== 'affiliate' && (product.stock ?? 0) > 0

  const handleAffiliateClick = () => {
    if (!product.affiliateUrl) return
    track('AffiliateClick', {
      content_ids: [product.id],
      content_name: product.name,
    })
  }

  const buildCartItem = () => ({
    productId: product.id,
    productType: product.type ?? 'normal',
    name: product.name,
    image: product.images[0] ?? '',
    price: displayPrice ?? 0,
    quantity,
    stock: product.stock ?? 0,
  })

  const handleAddToCart = () => {
    if (product.type === 'affiliate' || !inStock || displayPrice === undefined) return
    addItem(buildCartItem())
    track('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      value: displayPrice * quantity,
      currency: 'BDT',
    })
    toast.success('Added to cart')
  }

  const handleBuyNow = () => {
    if (product.type === 'affiliate' || !inStock || displayPrice === undefined) return
    addItem(buildCartItem())
    track('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      value: displayPrice * quantity,
      currency: 'BDT',
    })
    navigate('/checkout')
  }

  return (
    <>
      <Helmet>
        <title>{product.seoTitle || product.name} — Shoplexᴮᴰ</title>
        <meta
          name="description"
          content={product.seoDescription || product.shortDescription}
        />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.shortDescription} />
        {product.images[0] && <meta property="og:image" content={product.images[0]} />}
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="overflow-hidden rounded-[32px] border border-emerald-100 bg-[linear-gradient(135deg,_rgba(255,255,255,1),_rgba(240,253,244,0.9),_rgba(255,255,255,1))] p-4 shadow-[0_28px_80px_rgba(15,23,42,0.08)] md:p-6">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <ImageGallery
              images={product.images}
              productName={product.name}
            />

            <div className="flex flex-col justify-center">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {product.featured && (
                  <Badge variant="success">Featured</Badge>
                )}
                {product.type !== 'affiliate' && (
                  inStock ? (
                    <Badge variant="success">In stock</Badge>
                  ) : (
                    <Badge variant="danger">Out of stock</Badge>
                  )
                )}
              </div>

              <h1 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--color-deep-green)] md:text-4xl">
                {product.name}
              </h1>

              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-text-secondary)]">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {product.rating !== undefined ? product.rating.toFixed(1) : 'New'}
                </span>
                <span>
                  {product.reviewCount ?? 0} reviews
                </span>
                {product.type !== 'affiliate' && <span>SKU: {product.sku}</span>}
              </div>

              {displayPrice !== undefined && (
                <div className="mb-5 flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-bold tracking-[-0.04em] text-[color:var(--color-deep-green)] md:text-4xl">
                    {product.priceCurrency ? `${product.priceCurrency} ` : '৳'}{displayPrice}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-[color:var(--color-text-secondary)] line-through">
                        ৳{product.price}
                      </span>
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-600">
                        {discountPercent}% off
                      </span>
                    </>
                  )}
                </div>
              )}

              <p className="mb-6 text-base leading-7 text-[color:var(--color-text-secondary)]">
                {product.shortDescription}
              </p>

              {product.type === 'affiliate' ? (
                <div ref={actionsRef} className="flex flex-col gap-3">
                  <span className="text-xs text-[color:var(--color-text-secondary)]">Affiliate link</span>
                  {product.affiliateUrl ? (
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="sponsored nofollow noopener noreferrer"
                      onClick={handleAffiliateClick}
                      className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-button bg-[color:var(--color-emerald)] px-6 text-lg font-medium text-white shadow-sm transition-all duration-200 hover:bg-[color:var(--color-deep-green)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-emerald)] focus-visible:ring-offset-2"
                    >
                      <ExternalLink className="h-5 w-5" aria-hidden="true" />
                      <span>Buy on partner site</span>
                    </a>
                  ) : (
                    <p className="text-sm text-red-600">The partner link is unavailable.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-[color:var(--color-text-primary)]">Quantity</span>
                    <QuantitySelector
                      quantity={quantity}
                      onChange={setQuantity}
                      max={product.stock || 1}
                    />
                    <span className="text-sm text-[color:var(--color-text-secondary)]">
                      {inStock ? `${product.stock} available` : 'Currently unavailable'}
                    </span>
                  </div>

                  <div ref={actionsRef} className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      disabled={!inStock}
                      leftIcon={<ShoppingCart className="h-5 w-5" />}
                      onClick={handleAddToCart}
                    >
                      Add to cart
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={!inStock}
                      leftIcon={<Zap className="h-5 w-5" />}
                      onClick={handleBuyNow}
                    >
                      Buy now
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
                Product details
              </h2>
            </div>
            <div className="whitespace-pre-line text-sm leading-7 text-[color:var(--color-text-primary)]">
              {product.fullDescription}
            </div>

            {featureList.length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {featureList.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 rounded-2xl border border-gray-200 bg-stone-50 px-3 py-2.5 text-sm text-[color:var(--color-text-primary)]"
                  >
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        <div className="mt-10 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-xl font-semibold text-[color:var(--color-deep-green)]">
            Reviews
          </h2>
          <div className="mb-6">
            <ReviewForm onSubmit={handleReviewSubmit} />
          </div>
          <ReviewList reviews={reviews} />
        </div>

        <div className="mt-10">
          <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
        </div>
      </div>

      {showStickyActions && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-emerald-100 bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur md:bottom-4 md:left-1/2 md:right-auto md:w-[min(560px,calc(100%-2rem))] md:-translate-x-1/2 md:rounded-2xl md:border md:px-4">
          <div className="mx-auto flex max-w-7xl gap-3 pb-[env(safe-area-inset-bottom)] md:pb-0">
            {product.type === 'affiliate' ? (
              product.affiliateUrl && (
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  onClick={handleAffiliateClick}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-button bg-[color:var(--color-emerald)] px-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[color:var(--color-deep-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-emerald)] focus-visible:ring-offset-2"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>Buy on partner site</span>
                </a>
              )
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  disabled={!inStock}
                  leftIcon={<ShoppingCart className="h-4 w-4" />}
                  onClick={handleAddToCart}
                >
                  Add to cart
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={!inStock}
                  leftIcon={<Zap className="h-4 w-4" />}
                  onClick={handleBuyNow}
                >
                  Order now
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ProductDetail