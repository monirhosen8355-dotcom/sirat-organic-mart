import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Phone, MapPin, StickyNote } from 'lucide-react'
import { getOrderById, getOrderStatusHistory } from '../../services/orders/orderService'
import { useAuthStore } from '../../store/authStore'
import type { Order, OrderStatusHistoryEntry } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import { getThumbnailUrl } from '../../lib/cloudinary/transform'

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false

    async function load() {
      try {
        const result = await getOrderById(orderId!)
        if (cancelled) return

        // নিজের অর্ডার না হলে দেখানো যাবে না (firestore.rules-এর সাথে সামঞ্জস্য রেখে)
        if (!result || (result.userId && result.userId !== user?.uid)) {
          setNotFound(true)
          return
        }

        setOrder(result)
        const statusHistory = await getOrderStatusHistory(orderId!)
        if (!cancelled) setHistory(statusHistory)
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          setNotFound(true)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [orderId, user])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-[color:var(--color-text-secondary)]">অর্ডারটি পাওয়া যায়নি।</p>
        <Link to="/account/orders" className="text-[color:var(--color-emerald)] underline">
          আমার অর্ডারে ফিরে যান
        </Link>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>অর্ডার #{order.id.slice(-8).toUpperCase()} — Sirat Organic Mart</title>
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
            অর্ডার #{order.id.slice(-8).toUpperCase()}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Status history timeline */}
        <Card className="mb-4">
          <h2 className="mb-3 text-sm font-medium">অর্ডার ট্র্যাকিং</h2>
          <div className="flex flex-col gap-3">
            {history.map((entry, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-emerald)]" />
                <div>
                  <OrderStatusBadge status={entry.status} />
                  <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                    {new Date(entry.timestamp).toLocaleString('bn-BD')}
                  </p>
                  {entry.note && <p className="mt-1 text-xs">{entry.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery info */}
        <Card className="mb-4 flex flex-col gap-3">
          <div className="flex items-start gap-2 text-sm">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" />
            <div>
              <p className="text-[color:var(--color-text-secondary)]">{order.customerName}</p>
              <p>{order.customerPhone}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" />
            <p>{order.deliveryAddress}</p>
          </div>
          {order.deliveryNote && (
            <div className="flex items-start gap-2 text-sm">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" />
              <p>{order.deliveryNote}</p>
            </div>
          )}
        </Card>

        {/* Items */}
        <Card className="mb-4">
          <h2 className="mb-3 font-medium">অর্ডার আইটেম</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={`${item.productId}-${item.variantId ?? ''}`} className="flex gap-3">
                <img
                  src={getThumbnailUrl(item.image)}
                  alt={item.name}
                  loading="lazy"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col justify-center">
                  <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[color:var(--color-text-secondary)]">
                    {item.quantity} x ৳{item.price}
                  </p>
                </div>
                <div className="shrink-0 text-sm font-semibold text-[color:var(--color-deep-green)]">
                  ৳{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-gray-100 pt-3 text-base font-semibold">
            <span>মোট</span>
            <span>৳{order.total}</span>
          </div>
        </Card>

        <div className="flex justify-center">
          <Link to="/account/orders">
            <Button variant="outline">সব অর্ডার দেখুন</Button>
          </Link>
        </div>
      </div>
    </>
  )
}

export default OrderDetail