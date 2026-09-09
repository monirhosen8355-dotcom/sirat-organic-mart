import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Package, ShoppingBag, Clock, CalendarDays, AlertTriangle } from 'lucide-react'
import { getDashboardOrderStats } from '../../services/orders/orderService'
import { getAllProductsAdmin } from '../../services/products/productService'
import type { Order, Product } from '../../types'
import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'

const LOW_STOCK_THRESHOLD = 5

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  todayOrders: number
  recentOrders: Order[]
  totalProducts: number
  lowStockProducts: Product[]
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [orderStats, products] = await Promise.all([
          getDashboardOrderStats(),
          getAllProductsAdmin(),
        ])
        if (cancelled) return

        setStats({
          ...orderStats,
          totalProducts: products.length,
          lowStockProducts: products.filter(
            (p) => p.active && p.stock <= LOW_STOCK_THRESHOLD
          ),
        })
      } catch (err) {
        if (!cancelled) {
          setError('ড্যাশবোর্ড ডেটা লোড করতে সমস্যা হয়েছে।')
          console.error(err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !stats) {
    return <p className="py-16 text-center text-red-600">{error}</p>
  }

  const statCards = [
    { label: 'মোট অর্ডার', value: stats.totalOrders, icon: ShoppingBag },
    { label: 'অপেক্ষমাণ অর্ডার', value: stats.pendingOrders, icon: Clock },
    { label: 'আজকের অর্ডার', value: stats.todayOrders, icon: CalendarDays },
    { label: 'মোট প্রোডাক্ট', value: stats.totalProducts, icon: Package },
  ]

  return (
    <>
      <Helmet>
        <title>ড্যাশবোর্ড — Admin — Sirat Organic Mart</title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        ড্যাশবোর্ড
      </h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex flex-col gap-2">
            <Icon className="h-5 w-5 text-[color:var(--color-emerald)]" />
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs text-[color:var(--color-text-secondary)]">{label}</span>
          </Card>
        ))}
      </div>

      {stats.lowStockProducts.length > 0 && (
        <Card className="mb-8 border-amber-300 bg-amber-50">
          <div className="mb-2 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">কম স্টকের প্রোডাক্ট</span>
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            {stats.lowStockProducts.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/products/${p.id}`} className="hover:underline">
                  {p.name} — মাত্র {p.stock}টি বাকি
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">সাম্প্রতিক অর্ডার</h2>
          <Link to="/admin/orders" className="text-sm text-[color:var(--color-emerald)]">
            সব দেখুন
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="py-4 text-sm text-[color:var(--color-text-secondary)]">
            এখনো কোনো অর্ডার নেই।
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">
                    #{order.id.slice(-8).toUpperCase()} — {order.customerName}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-secondary)]">
                    ৳{order.total}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

export default Dashboard