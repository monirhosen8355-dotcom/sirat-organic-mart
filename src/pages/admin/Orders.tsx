import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { getAllOrdersAdmin, updateOrderStatus } from '../../services/orders/orderService'
import type { Order, OrderStatus } from '../../types'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { TableSkeleton } from '../../components/common/Skeleton'

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

// টেবিলের ভিতরের dropdown-এর জন্য (এখানে 'all' থাকবে না, কারণ 'all' কোনো real status না)
const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = STATUS_TABS.filter(
  (tab): tab is { label: string; value: OrderStatus } => tab.value !== 'all'
)

// প্রতিটা status-এর জন্য select-এর রং, যাতে ব্যাজের মতোই এক নজরে বোঝা যায়
const STATUS_SELECT_STYLES: Record<OrderStatus, string> = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  confirmed: 'border-blue-300 bg-blue-50 text-blue-800',
  processing: 'border-blue-300 bg-blue-50 text-blue-800',
  shipped: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  delivered: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  cancelled: 'border-red-300 bg-red-50 text-red-800',
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // কোন কোন order এই মুহূর্তে আপডেট হচ্ছে (একসাথে একাধিক হতে পারে)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  async function loadOrders() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllOrdersAdmin(statusFilter === 'all' ? undefined : statusFilter)
      setOrders(data)
    } catch (err) {
      setError('There was a problem loading orders.')
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

  async function handleStatusChange(order: Order, newStatus: OrderStatus) {
    if (newStatus === order.status) return
    if (updatingIds.has(order.id)) return

    const previousStatus = order.status

    // Optimistic update — UI সাথে সাথেই বদলাবে, ব্যর্থ হলে আগের অবস্থায় ফিরবে
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    )
    setUpdatingIds((prev) => new Set(prev).add(order.id))

    try {
      await updateOrderStatus(order.id, newStatus)
      toast.success(`Order #${order.id.slice(-8).toUpperCase()} updated.`)

      // একটা নির্দিষ্ট status ফিল্টার চালু থাকলে, নতুন status সেই ফিল্টারের সাথে না
      // মিললে row-টা আর এই লিস্টে থাকার কথা না — তাই সরিয়ে দিচ্ছি।
      if (statusFilter !== 'all' && newStatus !== statusFilter) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id))
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not update status. Please try again.')
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: previousStatus } : o))
      )
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(order.id)
        return next
      })
    }
  }

  return (
    <>
      <Helmet>
        <title>Order management — Admin — Shoplexᴮᴰ</title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        Order management
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
          placeholder="Search by order ID, name, or phone number..."
          aria-label="Search orders"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : filteredOrders.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          No orders found.
        </p>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs text-[color:var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const isUpdating = updatingIds.has(order.id)
                return (
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
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          disabled={isUpdating}
                          aria-label={`Change status for order ${order.id
                            .slice(-8)
                            .toUpperCase()}`}
                          onChange={(e) =>
                            handleStatusChange(order, e.target.value as OrderStatus)
                          }
                          className={[
                            'h-9 rounded-full border px-3 text-xs font-medium transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]',
                            'disabled:cursor-not-allowed disabled:opacity-60',
                            STATUS_SELECT_STYLES[order.status],
                          ].join(' ')}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <span
                            role="status"
                            aria-label="Updating"
                            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-[color:var(--color-emerald)]"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                      {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

export default Orders