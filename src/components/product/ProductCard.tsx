import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '../../types'
import { getThumbnailUrl } from '../../lib/cloudinary/transform'
import { useCartStore } from '../../store/cartStore'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Button from '../common/Button'
import toast from 'react-hot-toast'
import { track } from '../../lib/analytics/track'

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem)
  const hasDiscount = !!product.discountPrice && product.discountPrice < product.price
  const displayPrice = hasDiscount ? product.discountPrice! : product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0
  const inStock = product.stock > 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock) return
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? '',
      price: displayPrice,
      quantity: 1,
      stock: product.stock,
    })
    track('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      value: displayPrice,
      currency: 'BDT',
    })
    toast.success('কার্টে যোগ হয়েছে')
  }

  return (
    <Link to={`/product/${product.slug}`}>
      <Card hoverable padded={false} className="overflow-hidden">
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          <img
            src={getThumbnailUrl(product.images[0] ?? '')}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {hasDiscount && (
            <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              {discountPercent}% ছাড়
            </span>
          )}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Badge variant="danger">স্টক শেষ</Badge>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="mb-1 line-clamp-2 text-sm font-medium text-[color:var(--color-text-primary)]">
            {product.name}
          </h3>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-base font-semibold text-[color:var(--color-deep-green)]">
              ৳{displayPrice}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[color:var(--color-text-secondary)] line-through">
                ৳{product.price}
              </span>
            )}
          </div>

          <Button
            size="sm"
            fullWidth
            variant={inStock ? 'primary' : 'ghost'}
            disabled={!inStock}
            leftIcon={<ShoppingCart className="h-4 w-4" />}
            onClick={handleAddToCart}
          >
            {inStock ? 'কার্টে যোগ করুন' : 'স্টক শেষ'}
          </Button>
        </div>
      </Card>
    </Link>
  )
}

export default ProductCard