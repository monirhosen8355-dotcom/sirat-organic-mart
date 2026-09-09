import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getAllOrdersAdmin } from '../../services/orders/orderService'
import type { Order, OrderStatus } from '../../types'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'সব', value: 'all' },
  { label: 'অপেক্ষমাণ', value: 'pending' },
  { label: 'কনফার্ম হয়েছে', value: 'confirmed' },
  { label: 'প্রসেসিং হচ্ছে', value: 'processing' },
  { label: 'পাঠানো হয়েছে', value: 'shipped' },
  { label: 'ডেলিভার হয়েছে', value: 'delivered' },
  { label: 'বাতিল হয়েছে', value: 'cancelled' },
]

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  async function loadOrders() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllOrdersAdmin(statusFilter === 'all' ? undefined : statusFilter)
      setOrders(data)
    } catch (err) {
      setError('অর্ডার লোড করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filteredOrders = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase()
    if (!lowerQuery) return orders
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(lowerQuery) ||
        o.customerName.toLowerCase().includes(lowerQuery) ||
        o.customerPhone.includes(lowerQuery)
    )
  }, [orders, searchQuery])

  return (
    <>
      <Helmet>
        <title>অর্ডার ম্যানেজমেন্ট — Admin — Sirat Organic Mart</title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        অর্ডার ম্যানেজমেন্ট
      </h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={[
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-[color:var(--color-emerald)] text-white'
                : 'bg-gray-100 text-[color:var(--color-text-secondary)] hover:bg-gray-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <Input
          placeholder="অর্ডার আইডি, নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : filteredOrders.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          কোনো অর্ডার পাওয়া যায়নি।
        </p>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs text-[color:var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">অর্ডার</th>
                <th className="px-4 py-3 font-medium">কাস্টমার</th>
                <th className="px-4 py-3 font-medium">মোট</th>
                <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                <th className="px-4 py-3 font-medium">তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="font-medium text-[color:var(--color-emerald)] hover:underline"
                    >
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.customerName}</p>
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      {order.customerPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium">৳{order.total}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                    {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

export default Orders