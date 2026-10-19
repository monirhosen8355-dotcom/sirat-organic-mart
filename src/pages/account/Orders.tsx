import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Package } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getOrdersByUser } from '../../services/orders/orderService'
import type { Order } from '../../types'
import Card from '../../components/common/Card'
import { OrderListSkeleton } from '../../components/common/Skeleton'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'

const Orders = () => {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getOrdersByUser(user.uid)
      .then((result) => {
        if (!cancelled) setOrders(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setError('অর্ডার লোড করতে সমস্যা হয়েছে।')
          console.error(err)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <>
      <Helmet>
        <title>অর্ডার হিস্টরি — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
          আমার অর্ডার
        </h1>

        {isLoading && <OrderListSkeleton count={4} />}

        {!isLoading && error && <p className="py-16 text-center text-red-600">{error}</p>}

        {!isLoading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="h-12 w-12 text-[color:var(--color-text-secondary)] opacity-40" />
            <p className="text-[color:var(--color-text-secondary)]">
              আপনার এখনো কোনো অর্ডার নেই।
            </p>
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link key={order.id} to={`/account/orders/${order.id}`}>
                <Card hoverable className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      {new Date(order.createdAt).toLocaleDateString('bn-BD')} · ৳{order.total}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Orders