import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ShoppingCart, Zap } from 'lucide-react'
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
import Spinner from '../../components/common/Spinner'
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
          value: p.discountPrice ?? p.price,
          currency: 'BDT',
        })
        const productReviews = await getApprovedReviews(p.id)
        if (!cancelled) setReviews(productReviews)
      })
      .catch((err) => {
        if (!cancelled) {
          setError('পণ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
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

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!product) return
    if (!user) {
      toast.error('রিভিউ দিতে হলে লগইন করুন')
      navigate('/login')
      return
    }
    await submitReview(product.id, {
      userId: user.uid,
      userName: user.displayName || 'কাস্টমার',
      rating,
      comment,
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-[color:var(--color-text-secondary)]">পণ্যটি পাওয়া যায়নি।</p>
        <Link to="/shop" className="text-[color:var(--color-emerald)] underline">
          শপে ফিরে যান
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="py-16 text-center text-red-600">{error}</p>
  }

  const hasDiscount = !!product.discountPrice && product.discountPrice < product.price
  const displayPrice = hasDiscount ? product.discountPrice! : product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0
  const inStock = product.stock > 0

  const buildCartItem = () => ({
    productId: product.id,
    name: product.name,
    image: product.images[0] ?? '',
    price: displayPrice,
    quantity,
    stock: product.stock,
  })

  const handleAddToCart = () => {
    if (!inStock) return
    addItem(buildCartItem())
    track('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      value: displayPrice * quantity,
      currency: 'BDT',
    })
    toast.success('কার্টে যোগ হয়েছে')
  }

  const handleBuyNow = () => {
    if (!inStock) return
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
        <title>{product.seoTitle || product.name} — Sirat Organic Mart</title>
        <meta
          name="description"
          content={product.seoDescription || product.shortDescription}
        />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.shortDescription} />
        {product.images[0] && <meta property="og:image" content={product.images[0]} />}
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ImageGallery images={product.images} productName={product.name} />

          <div>
            <h1 className="mb-2 text-xl font-semibold text-[color:var(--color-deep-green)] md:text-2xl">
              {product.name}
            </h1>

            {product.rating !== undefined && product.reviewCount ? (
              <p className="mb-3 text-sm text-[color:var(--color-text-secondary)]">
                ⭐ {product.rating.toFixed(1)} ({product.reviewCount} রিভিউ)
              </p>
            ) : null}

            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-[color:var(--color-deep-green)]">
                ৳{displayPrice}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-[color:var(--color-text-secondary)] line-through">
                    ৳{product.price}
                  </span>
                  <Badge variant="danger">{discountPercent}% ছাড়</Badge>
                </>
              )}
            </div>

            <div className="mb-4">
              {inStock ? (
                <Badge variant="success">স্টকে আছে ({product.stock}টি)</Badge>
              ) : (
                <Badge variant="danger">স্টক শেষ</Badge>
              )}
            </div>

            <p className="mb-5 text-sm text-[color:var(--color-text-secondary)]">
              {product.shortDescription}
            </p>

            <div className="mb-5 flex items-center gap-4">
              <span className="text-sm font-medium">পরিমাণ:</span>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={product.stock || 1}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                disabled={!inStock}
                leftIcon={<ShoppingCart className="h-5 w-5" />}
                onClick={handleAddToCart}
              >
                কার্টে যোগ করুন
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!inStock}
                leftIcon={<Zap className="h-5 w-5" />}
                onClick={handleBuyNow}
              >
                এখনই কিনুন
              </Button>
            </div>
          </div>
        </div>

        {/* বিস্তারিত বিবরণ */}
        <div className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="mb-3 text-lg font-semibold text-[color:var(--color-deep-green)]">
            বিস্তারিত বিবরণ
          </h2>
          <div className="whitespace-pre-line text-sm text-[color:var(--color-text-primary)]">
            {product.fullDescription}
          </div>
        </div>

        {/* রিভিউ */}
        <div className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-deep-green)]">
            রিভিউ
          </h2>
          <div className="mb-6">
            <ReviewForm onSubmit={handleReviewSubmit} />
          </div>
          <ReviewList reviews={reviews} />
        </div>

        {/* রিলেটেড প্রোডাক্ট */}
        <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
      </div>
    </>
  )
}

export default ProductDetail