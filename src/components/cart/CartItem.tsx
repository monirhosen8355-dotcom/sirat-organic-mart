import { Trash2 } from 'lucide-react'
import type { CartItem as CartItemType } from '../../types'
import { useCartStore } from '../../store/cartStore'
import { getThumbnailUrl } from '../../lib/cloudinary/transform'
import QuantitySelector from '../product/QuantitySelector'

interface CartItemProps {
  item: CartItemType
}

const CartItem = ({ item }: CartItemProps) => {
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  return (
    <div className="flex gap-3 border-b border-gray-100 py-4 last:border-0">
      <img
        src={getThumbnailUrl(item.image)}
        alt={item.name}
        loading="lazy"
        className="h-20 w-20 shrink-0 rounded-lg object-cover"
      />

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-2 text-sm font-medium">{item.name}</h3>
          {item.variantLabel && (
            <p className="text-xs text-[color:var(--color-text-secondary)]">
              {item.variantLabel}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold text-[color:var(--color-deep-green)]">
            ৳{item.price}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <QuantitySelector
            quantity={item.quantity}
            onChange={(q) => updateQuantity(item.productId, q, item.variantId)}
            max={item.stock || 1}
          />
          <button
            onClick={() => removeItem(item.productId, item.variantId)}
            aria-label="Remove"
            className="p-2 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartItem