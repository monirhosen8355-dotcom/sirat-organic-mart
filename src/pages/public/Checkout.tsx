import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import CheckoutForm from '../../components/checkout/CheckoutForm'
import OrderSummary from '../../components/checkout/OrderSummary'
import { DELIVERY_CHARGES, type DeliveryZone } from '../../lib/delivery/deliveryZones'
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
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null)
  const deliveryCharge = deliveryZone ? DELIVERY_CHARGES[deliveryZone] : 0

  // After an order is successfully placed, clearCart() runs and items.length becomes 0.
  // We should not trigger this redirect at that moment, otherwise a race could redirect to
  // /cart instead of /order-confirmation. State is used instead of ref because the value is
  // read during render, and reading ref.current during render is against React rules.
  const [orderPlaced, setOrderPlaced] = useState(false)

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

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/cart', { replace: true })
    }
  }, [items.length, orderPlaced, navigate])

  if (items.length === 0 && !orderPlaced) {
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
        deliveryZone: data.deliveryZone,
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
        deliveryCharge,
        discount,
        couponCode: appliedCouponCode ?? undefined,
        total: subtotal + deliveryCharge - discount,
        paymentMethod: 'cod',
      })

      setOrderPlaced(true)
      navigate(`/order-confirmation/${orderId}`)
      clearCart()
    } catch (error) {
      console.error('Order creation failed:', error)
      toast.error('The order could not be submitted. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-text-primary)]">
        Checkout
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <CheckoutForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            deliveryZone={deliveryZone}
            onDeliveryZoneChange={setDeliveryZone}
          />
        </div>

        <div className="order-1 md:order-2">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            onCouponApplied={handleCouponApplied}
            discount={discount}
            deliveryCharge={deliveryCharge}
            appliedCouponCode={appliedCouponCode}
          />
        </div>
      </div>
    </div>
  )
}

export default Checkout