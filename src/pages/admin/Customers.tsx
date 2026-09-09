import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { getAllUsersAdmin } from '../../services/users/userService'
import { getAllOrdersAdmin } from '../../services/orders/orderService'
import type { UserProfile, Order } from '../../types'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'

interface CustomerRow extends UserProfile {
  orderCount: number
  totalSpent: number
}

const Customers = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [userData, orderData] = await Promise.all([
          getAllUsersAdmin(),
          getAllOrdersAdmin(),
        ])
        setUsers(userData)
        setOrders(orderData)
      } catch (err) {
        setError('কাস্টমার লোড করতে সমস্যা হয়েছে।')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const customers: CustomerRow[] = useMemo(() => {
    return users.map((user) => {
      const userOrders = orders.filter((o) => o.userId === user.uid)
      return {
        ...user,
        orderCount: userOrders.length,
        totalSpent: userOrders.reduce((sum, o) => sum + o.total, 0),
      }
    })
  }, [users, orders])

  const filteredCustomers = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase()
    if (!lowerQuery) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(lowerQuery) ||
        (c.email ?? '').toLowerCase().includes(lowerQuery)
    )
  }, [customers, searchQuery])

  return (
    <>
      <Helmet>
        <title>কাস্টমার — Admin — Sirat Organic Mart</title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        কাস্টমার
      </h1>

      <div className="mb-6">
        <Input
          placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <p className="mb-4 text-xs text-[color:var(--color-text-secondary)]">
        এখানে শুধু রেজিস্টার্ড কাস্টমার দেখানো হচ্ছে। guest checkout-এ করা অর্ডার কোনো
        অ্যাকাউন্টের সাথে যুক্ত না থাকায় এই লিস্টে আসে না — সেগুলো অর্ডার লিস্ট থেকে দেখা
        যাবে।
      </p>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : filteredCustomers.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          কোনো কাস্টমার পাওয়া যায়নি।
        </p>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs text-[color:var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">নাম</th>
                <th className="px-4 py-3 font-medium">ফোন</th>
                <th className="px-4 py-3 font-medium">ইমেইল</th>
                <th className="px-4 py-3 font-medium">মোট অর্ডার</th>
                <th className="px-4 py-3 font-medium">মোট খরচ</th>
                <th className="px-4 py-3 font-medium">যোগদান</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.uid}>
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{customer.email ?? '—'}</td>
                  <td className="px-4 py-3">{customer.orderCount}</td>
                  <td className="px-4 py-3">৳{customer.totalSpent}</td>
                  <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                    {new Date(customer.createdAt).toLocaleDateString('bn-BD', {
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

export default Customers