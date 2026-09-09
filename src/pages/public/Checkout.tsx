import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import CheckoutForm from '../../components/checkout/CheckoutForm'
import OrderSummary, { DELIVERY_CHARGE } from '../../components/checkout/OrderSummary'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { createOrder } from '../../services/orders/orderService'
import { track } from '../../lib/analytics/track'
import type { CheckoutFormData } from '../../lib/validation/checkoutSchema'

const Checkout = () => {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.subtotal())
  const clearCart = useCartStore((state) => state.clearCart)
  const user = useAuthStore((state) => state.user)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null)

  const handleCouponApplied = (
    newDiscount: number,
    code: string | null
  ) => {
    setDiscount(newDiscount)
    setAppliedCouponCode(code)
  }

  useEffect(() => {
    if (items.length === 0) return
    track('InitiateCheckout', {
      content_ids: items.map((item) => item.productId),
      num_items: items.length,
      value: subtotal,
      currency: 'BDT',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // কার্ট খালি হলে চেকআউটে কিছু করার নেই — কার্টে ফেরত পাঠাই।
  // ব্যতিক্রম: অর্ডার সফল হওয়ার পর clearCart() কল করা হয়, তখনও items.length
  // === 0 হয়ে যায় — কিন্তু তখন এই রিডাইরেক্ট ফায়ার করা উচিত না (নইলে
  // /order-confirmation-এর বদলে /cart-এ চলে যাওয়ার race তৈরি হয়)। তাই
  // orderPlacedRef একটা explicit flag হিসেবে ব্যবহার করা হচ্ছে — timing/commit
  // order-এর উপর নির্ভর না করে নিশ্চিতভাবে এই কেসটা বাদ দেওয়ার জন্য।
  const orderPlacedRef = useRef(false)

  useEffect(() => {
    if (items.length === 0 && !orderPlacedRef.current) {
      navigate('/cart', { replace: true })
    }
  }, [items.length, navigate])

  if (items.length === 0 && !orderPlacedRef.current) {
    return null
  }

  const handleSubmit = async (data: CheckoutFormData) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const orderId = await createOrder({
        userId: user?.uid,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        deliveryNote: data.deliveryNote || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
        })),
        subtotal,
        deliveryCharge: DELIVERY_CHARGE,
        discount,
        couponCode: appliedCouponCode ?? undefined,
        total: subtotal + DELIVERY_CHARGE - discount,
        paymentMethod: 'cod',
      })

      orderPlacedRef.current = true
      navigate(`/order-confirmation/${orderId}`)
      clearCart()
    } catch (error) {
      console.error('Order creation failed:', error)
      toast.error('অর্ডার সাবমিট করা যায়নি। আবার চেষ্টা করুন।')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-text-primary)]">
        চেকআউট
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <CheckoutForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="order-1 md:order-2">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            onCouponApplied={handleCouponApplied}
            discount={discount}
            appliedCouponCode={appliedCouponCode}
          />
        </div>
      </div>
    </div>
  )
}

export default Checkout