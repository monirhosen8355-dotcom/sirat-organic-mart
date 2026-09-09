import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import {
  getOrderById,
  getOrderStatusHistory,
  updateOrderStatus,
} from '../../services/orders/orderService'
import type { Order, OrderStatus, OrderStatusHistoryEntry } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: 'অপেক্ষমাণ', value: 'pending' },
  { label: 'কনফার্ম হয়েছে', value: 'confirmed' },
  { label: 'প্রসেসিং হচ্ছে', value: 'processing' },
  { label: 'পাঠানো হয়েছে', value: 'shipped' },
  { label: 'ডেলিভার হয়েছে', value: 'delivered' },
  { label: 'বাতিল হয়েছে', value: 'cancelled' },
]

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>()

  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextStatus, setNextStatus] = useState<OrderStatus>('pending')
  const [statusNote, setStatusNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  async function loadOrder() {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const [orderData, historyData] = await Promise.all([
        getOrderById(id),
        getOrderStatusHistory(id),
      ])
      if (!orderData) {
        setError('অর্ডার পাওয়া যায়নি।')
        return
      }
      setOrder(orderData)
      setHistory(historyData)
      setNextStatus(orderData.status)
    } catch (err) {
      setError('অর্ডার লোড করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleStatusUpdate() {
    if (!id || !order) return
    if (nextStatus === order.status) {
      toast.error('নতুন স্ট্যাটাস বর্তমান স্ট্যাটাসের মতোই।')
      return
    }

    setIsUpdating(true)
    try {
      await updateOrderStatus(id, nextStatus, statusNote.trim() || undefined)
      toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে।')
      setStatusNote('')
      await loadOrder()
    } catch (err) {
      toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !order) {
    return <p className="py-16 text-center text-red-600">{error}</p>
  }

  return (
    <>
      <Helmet>
        <title>অর্ডার #{order.id.slice(-8).toUpperCase()} — Admin — Sirat Organic Mart</title>
      </Helmet>

      <Link
        to="/admin/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-text-secondary)] hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        অর্ডার লিস্টে ফিরুন
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          অর্ডার #{order.id.slice(-8).toUpperCase()}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-medium">কাস্টমার তথ্য</h2>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[color:var(--color-text-secondary)]">নাম</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--color-text-secondary)]">ফোন</dt>
                <dd>{order.customerPhone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[color:var(--color-text-secondary)]">ঠিকানা</dt>
                <dd>{order.deliveryAddress}</dd>
              </div>
              {order.deliveryNote && (
                <div className="sm:col-span-2">
                  <dt className="text-[color:var(--color-text-secondary)]">নোট</dt>
                  <dd>{order.deliveryNote}</dd>
                </div>
              )}
              <div>
                <dt className="text-[color:var(--color-text-secondary)]">পেমেন্ট মেথড</dt>
                <dd>ক্যাশ অন ডেলিভারি</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 font-medium">প্রোডাক্ট</h2>
            <div className="flex flex-col divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex gap-3 py-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.variantLabel && (
                      <p className="text-xs text-[color:var(--color-text-secondary)]">
                        {item.variantLabel}
                      </p>
                    )}
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      ৳{item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="font-medium">৳{item.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 border-t border-gray-100 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--color-text-secondary)]">সাবটোটাল</span>
                <span>৳{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--color-text-secondary)]">ডেলিভারি চার্জ</span>
                <span>৳{order.deliveryCharge}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>ছাড় {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>-৳{order.discount}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
                <span>মোট</span>
                <span>৳{order.total}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-medium">স্ট্যাটাস হিস্টরি</h2>
            <div className="flex flex-col gap-3">
              {history.map((entry, index) => (
                <div key={index} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-emerald)]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={entry.status} />
                      <span className="text-xs text-[color:var(--color-text-secondary)]">
                        {new Date(entry.timestamp).toLocaleString('bn-BD')}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="mt-0.5 text-sm text-[color:var(--color-text-secondary)]">
                        {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex h-fit flex-col gap-3">
          <h2 className="font-medium">স্ট্যাটাস পরিবর্তন করুন</h2>

          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            disabled={isUpdating}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <textarea
            placeholder="নোট (ঐচ্ছিক)"
            rows={3}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            disabled={isUpdating}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]"
          />

          <Button onClick={handleStatusUpdate} isLoading={isUpdating} fullWidth>
            আপডেট করুন
          </Button>
        </Card>
      </div>
    </>
  )
}

export default OrderDetail