import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import CartItem from '../../components/cart/CartItem'
import CartSummary from '../../components/cart/CartSummary'
import Button from '../../components/common/Button'

const Cart = () => {
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.subtotal())
  const clearCart = useCartStore((state) => state.clearCart)

  return (
    <>
      <Helmet>
        <title>Cart — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">Cart</h1>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <ShoppingBag className="h-14 w-14 text-[color:var(--color-text-secondary)] opacity-40" />
            <p className="text-[color:var(--color-text-secondary)]">
              Your cart is currently empty.
            </p>
            <Link to="/shop">
              <Button>Start shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 md:col-span-2">
              {items.map((item) => (
                <CartItem key={`${item.productId}-${item.variantId ?? ''}`} item={item} />
              ))}
            </div>

            <div>
              <CartSummary subtotal={subtotal} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Cart