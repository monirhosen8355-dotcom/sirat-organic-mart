import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import Input from '../common/Input'
import { validateCoupon } from '../../services/coupons/couponService'
import type { CartItem } from '../../types'

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  discount: number
  deliveryCharge: number
  appliedCouponCode: string | null
  onCouponApplied: (discount: number, code: string | null) => void
}

const OrderSummary = ({
  items,
  subtotal,
  discount,
  deliveryCharge,
  appliedCouponCode,
  onCouponApplied,
}: OrderSummaryProps) => {
  const [couponInput, setCouponInput] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [couponError, setCouponError] = useState('')

  const total = subtotal + deliveryCharge - discount

  const handleApplyCoupon = async () => {
    const code = couponInput.trim()
    if (!code || isApplying) return

    setIsApplying(true)
    setCouponError('')

    try {
      const result = await validateCoupon(code, subtotal)

      if (result.valid) {
        onCouponApplied(result.discountAmount, result.couponCode ?? code.toUpperCase())
        toast.success('Coupon applied successfully.')
      } else {
        setCouponError(result.error || 'The coupon code is invalid.')
      }
    } catch (err) {
      console.error('Coupon application failed:', err)
      setCouponError('We could not validate the coupon. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponInput('')
    setCouponError('')
    onCouponApplied(0, null)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-medium">Order summary</h3>

      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId ?? 'default'}`}
            className="flex items-center gap-3 text-sm"
          >
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[color:var(--color-text-primary)]">
                {item.name}
              </p>
              {item.variantLabel && (
                <p className="text-xs text-[color:var(--color-text-secondary)]">
                  {item.variantLabel}
                </p>
              )}
              <p className="text-xs text-[color:var(--color-text-secondary)]">
                ৳{item.price} × {item.quantity}
              </p>
            </div>
            <span className="flex-shrink-0 font-medium">
              ৳{item.price * item.quantity}
            </span>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-100 py-3">
        {appliedCouponCode ? (
          <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
            <span className="font-medium text-green-700">
              Coupon applied: {appliedCouponCode}
            </span>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-xs text-red-600 underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                error={couponError}
                fullWidth
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              isLoading={isApplying}
              onClick={handleApplyCoupon}
              disabled={!couponInput.trim()}
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[color:var(--color-text-secondary)]">Subtotal</span>
          <span>৳{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[color:var(--color-text-secondary)]">Delivery charge</span>
          <span>{deliveryCharge > 0 ? `৳${deliveryCharge}` : 'এলাকা নির্বাচন করুন'}</span>
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
    </div>
  )
}

export default OrderSummary