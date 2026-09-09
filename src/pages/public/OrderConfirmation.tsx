import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Phone, MapPin, StickyNote } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import { getOrderById } from '../../services/orders/orderService'
import { getThumbnailUrl } from '../../lib/cloudinary/transform'
import { track } from '../../lib/analytics/track'
import type { Order } from '../../types'

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setNotFound(true)
      setIsLoading(false)
      return
    }
    let cancelled = false
    getOrderById(orderId)
      .then((result) => {
        if (cancelled) return
        if (!result) setNotFound(true)
        else setOrder(result)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [orderId])

  useEffect(() => {
    if (!order) return
    const guardKey = `purchase-tracked:${order.id}`
    if (!sessionStorage.getItem(guardKey)) {
      track('Purchase', {
        value: order.total,
        currency: 'BDT',
        orderId: order.id,
        content_ids: order.items.map((item) => item.productId),
        num_items: order.items.length,
      })
      sessionStorage.setItem(guardKey, '1')
    }
  }, [order])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="অর্ডার লোড হচ্ছে..." />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium text-[color:var(--color-text-primary)]">
          এই অর্ডারটি খুঁজে পাওয়া যায়নি।
        </p>
        <Link to="/">
          <Button variant="primary">হোমপেজে ফিরে যান</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <CheckCircle2 className="mb-3 h-14 w-14 text-[color:var(--color-emerald)]" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-[color:var(--color-text-primary)]">অর্ডার সফল হয়েছে!</h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          অর্ডার নম্বর: <span className="font-medium">#{order.id.slice(-8).toUpperCase()}</span>
        </p>
      </div>

      <Card className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[color:var(--color-text-secondary)]">বর্তমান অবস্থা</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex items-start gap-2 border-t border-gray-100 pt-3 text-sm">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" aria-hidden="true" />
          <div>
            <p className="text-[color:var(--color-text-secondary)]">{order.customerName}</p>
            <p>{order.customerPhone}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" aria-hidden="true" />
          <p>{order.deliveryAddress}</p>
        </div>
        {order.deliveryNote && (
          <div className="flex items-start gap-2 text-sm">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" aria-hidden="true" />
            <p>{order.deliveryNote}</p>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-medium">অর্ডার আইটেম</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={`${item.productId}-${item.variantId ?? ''}`} className="flex gap-3">
              <div className="relative shrink-0">
                <img
                  src={getThumbnailUrl(item.image)}
                  alt={item.name}
                  loading="lazy"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-deep-green)] text-xs font-medium text-white">
                  {item.quantity}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                {item.variantLabel && <p className="text-xs text-[color:var(--color-text-secondary)]">{item.variantLabel}</p>}
              </div>
              <div className="shrink-0 text-sm font-semibold text-[color:var(--color-deep-green)]">
                ৳{item.price * item.quantity}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[color:var(--color-text-secondary)]">সাবটোটাল</span>
            <span>৳{order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[color:var(--color-text-secondary)]">ডেলিভারি চার্জ</span>
            <span>৳{order.deliveryCharge}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-[color:var(--color-text-secondary)]">ছাড় {order.couponCode ? `(${order.couponCode})` : ''}</span>
              <span>−৳{order.discount}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
            <span>মোট (ক্যাশ অন ডেলিভারি)</span>
            <span>৳{order.total}</span>
          </div>
        </div>
      </Card>

      <p className="mb-6 text-center text-sm text-[color:var(--color-text-secondary)]">
        আপনার পণ্য ডেলিভারির সময় ক্যাশ পরিশোধ করুন। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবে।
      </p>

      <div className="flex justify-center">
        <Link to="/shop">
          <Button variant="outline">কেনাকাটা চালিয়ে যান</Button>
        </Link>
      </div>
    </div>
  )
}

export default OrderConfirmation