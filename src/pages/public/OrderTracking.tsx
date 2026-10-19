import { useState, type FormEvent } from 'react'
import { CalendarDays, MapPin, Package, Search } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { getOrderById } from '../../services/orders/orderService'
import type { Order } from '../../types'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'
import { getThumbnailUrl } from '../../lib/cloudinary/transform'

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const exactOrderId = orderId.trim()

    if (!exactOrderId) {
      setOrder(null)
      setError('Enter the exact Order ID from your order confirmation.')
      return
    }

    setIsLoading(true)
    setOrder(null)
    setError(null)

    try {
      const result = await getOrderById(exactOrderId)
      if (!result) {
        setError('No order was found with that exact Order ID.')
        return
      }
      setOrder(result)
    } catch (requestError) {
      console.error('Order tracking lookup failed:', requestError)
      setError('We could not look up that order right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Order Tracking — Shoplexᴮᴰ</title>
        <meta
          name="description"
          content="Check the current status and summary of an order using its exact Order ID."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[color:var(--color-emerald)]">
            <MapPin className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-[color:var(--color-deep-green)] sm:text-3xl">
            Order Tracking
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
            Enter the exact Order ID from your confirmation to see the latest order status.
          </p>
        </div>

        <Card className="mx-auto max-w-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input
              id="order-id"
              label="Order ID"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Paste your Order ID"
              autoComplete="off"
              spellCheck={false}
              error={error ?? undefined}
            />
            <Button
              type="submit"
              size="md"
              isLoading={isLoading}
              leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
              className="shrink-0 sm:mb-0"
            >
              Track order
            </Button>
          </form>
        </Card>

        {order && (
          <div className="mt-6 flex flex-col gap-4">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]">
                    Order ID
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-[color:var(--color-deep-green)]">
                    {order.id}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" aria-hidden="true" />
                  <div>
                    <p className="text-[color:var(--color-text-secondary)]">Placed on</p>
                    <p className="font-medium">{new Date(order.createdAt).toLocaleString('en-BD')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" aria-hidden="true" />
                  <div>
                    <p className="text-[color:var(--color-text-secondary)]">Delivery area</p>
                    <p className="font-medium">{order.deliveryZone === 'dhaka' ? 'Dhaka' : 'Outside Dhaka'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-[color:var(--color-emerald)]" aria-hidden="true" />
                <h2 className="font-semibold text-[color:var(--color-deep-green)]">Order summary</h2>
              </div>
              <div className="flex flex-col divide-y divide-gray-100">
                {order.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <img
                      src={getThumbnailUrl(item.image)}
                      alt={item.name}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[color:var(--color-text-secondary)]">
                        {item.quantity} × ৳{item.price}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[color:var(--color-deep-green)]">
                      ৳{item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-100 pt-3 font-semibold">
                <span>Total</span>
                <span className="text-[color:var(--color-deep-green)]">৳{order.total}</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}

export default OrderTracking
