import { Link } from 'react-router-dom'
import Button from '../common/Button'

interface CartSummaryProps {
  subtotal: number
  deliveryCharge?: number
  discount?: number
  showCheckoutButton?: boolean
}

const CartSummary = ({
  subtotal,
  deliveryCharge = 0,
  discount = 0,
  showCheckoutButton = true,
}: CartSummaryProps) => {
  const total = subtotal + deliveryCharge - discount

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-medium">Order summary</h3>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[color:var(--color-text-secondary)]">Subtotal</span>
          <span>৳{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[color:var(--color-text-secondary)]">Delivery charge</span>
          <span>{deliveryCharge > 0 ? `৳${deliveryCharge}` : 'Shown at checkout'}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount</span>
            <span>−৳{discount}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
          <span>Total</span>
          <span>৳{total}</span>
        </div>
      </div>

      {showCheckoutButton && (
        <Link to="/checkout" className="mt-4 block">
          <Button fullWidth size="lg">
            Checkout
          </Button>
        </Link>
      )}
    </div>
  )
}

export default CartSummary