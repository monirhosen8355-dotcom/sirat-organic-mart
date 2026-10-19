import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { Order, OrderStatus, OrderStatusHistoryEntry } from '../../types'

const ORDERS_COLLECTION = 'orders'

export function calculateOrderTotal(
  subtotal: number,
  deliveryCharge: number,
  discount: number
): number {
  return subtotal + deliveryCharge - discount
}

/**
 * নতুন অর্ডার তৈরি করে — checkout থেকে কল হবে (guest বা logged-in দুটোতেই)।
 * userId না থাকলে (guest checkout) undefined থাকবে।
 *
 * নোট: প্রাথমিক "pending" status আলাদা করে statusHistory subcollection-এ লেখা হয় না,
 * কারণ firestore.rules অনুযায়ী সেই subcollection শুধু admin-write। প্রথম স্ট্যাটাস
 * order ডকুমেন্টের নিজের status + createdAt থেকেই বোঝা যায় (getOrderStatusHistory
 * ফাংশনে এটাই synthesized করা হয়)। এরপর admin যত status বদলাবে, সেগুলোই
 * subcollection-এ যাবে।
 */
export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const productIds = [...new Set(data.items.map((item) => item.productId))]
  const productSnapshots = await Promise.all(
    productIds.map((productId) => getDoc(doc(db, 'products', productId)))
  )
  if (productSnapshots.some((snapshot) => !snapshot.exists())) {
    throw new Error('An order item is no longer available.')
  }
  if (productSnapshots.some((snapshot) => snapshot.data()?.type === 'affiliate')) {
    throw new Error('Affiliate products cannot be added to an order.')
  }

  const orderData = {
    ...data,
    status: 'pending' as OrderStatus,
    createdAt: Date.now(),
  }
  const ref = await addDoc(collection(db, ORDERS_COLLECTION), orderData)
  return ref.id
}

export async function getOrderById(id: string): Promise<Order | null> {
  const ref = doc(db, ORDERS_COLLECTION, id)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null
}

/**
 * লগইন করা কাস্টমারের নিজের অর্ডার হিস্টরি — নতুন থেকে পুরনো।
 */
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
}

/**
 * অ্যাডমিন অর্ডার লিস্ট — status filter সহ, না দিলে সব অর্ডার।
 */
export async function getAllOrdersAdmin(status?: OrderStatus): Promise<Order[]> {
  const constraints = status ? [where('status', '==', status)] : []
  const q = query(
    collection(db, ORDERS_COLLECTION),
    ...constraints,
    orderBy('createdAt', 'desc'),
    limit(200)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
}

/**
 * আজকের অর্ডার / pending অর্ডার সংখ্যা — অ্যাডমিন ড্যাশবোর্ডের জন্য (Phase 16)।
 */
export async function getDashboardOrderStats() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [allSnap, pendingSnap] = await Promise.all([
    getDocs(query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'), limit(500))),
    getDocs(query(collection(db, ORDERS_COLLECTION), where('status', '==', 'pending'))),
  ])

  const all = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
  const todayCount = all.filter((o) => o.createdAt >= startOfToday.getTime()).length

  return {
    totalOrders: all.length,
    pendingOrders: pendingSnap.size,
    todayOrders: todayCount,
    recentOrders: all.slice(0, 10),
  }
}

/**
 * অ্যাডমিন status পরিবর্তন করলে — অর্ডার ডকুমেন্ট আপডেট হয় এবং history subcollection-এ
 * একটা নতুন entry যোগ হয়। এই ফাংশন সবসময় admin থেকেই কল হবে (AdminRoute দিয়ে গার্ড করা
 * পেজ থেকে), তাই firestore.rules-এর isAdmin() শর্ত পূরণ হয়।
 */
export async function updateOrderDeliveryCharge(
  orderId: string,
  newDeliveryCharge: number
): Promise<void> {
  const normalizedCharge = Number(newDeliveryCharge)
  if (!Number.isFinite(normalizedCharge) || normalizedCharge < 0) {
    throw new Error('Delivery charge must be a non-negative number.')
  }

  const orderRef = doc(db, ORDERS_COLLECTION, orderId)

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef)
    if (!orderSnapshot.exists()) {
      throw new Error('Order not found.')
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() } as Order
    const total = calculateOrderTotal(order.subtotal, normalizedCharge, order.discount)

    transaction.update(orderRef, {
      deliveryCharge: normalizedCharge,
      total,
    })
  })
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId)

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef)
    if (!orderSnapshot.exists()) {
      throw new Error('Order not found.')
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() } as Order
    const shouldDeductStock =
      (newStatus === 'confirmed' || newStatus === 'delivered') &&
      !order.stockDeductedAt

    if (!shouldDeductStock) {
      transaction.update(orderRef, { status: newStatus })
      return
    }

    const quantitiesByProduct = new Map<string, number>()
    for (const item of order.items) {
      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity
      )
    }

    const productEntries = [...quantitiesByProduct.entries()].map(([productId, quantity]) => ({
      ref: doc(db, 'products', productId),
      quantity,
    }))
    const productSnapshots = await Promise.all(
      productEntries.map(({ ref }) => transaction.get(ref))
    )

    productSnapshots.forEach((productSnapshot, index) => {
      if (!productSnapshot.exists()) {
        throw new Error(`Product ${productEntries[index].ref.id} was not found.`)
      }

      const productData = productSnapshot.data()
      if (productData.type === 'affiliate') {
        throw new Error(`Affiliate product ${productEntries[index].ref.id} cannot be inventoried.`)
      }

      const currentStock = Number(productData.stock ?? 0)
      const requestedQuantity = productEntries[index].quantity
      if (currentStock < requestedQuantity) {
        throw new Error(`Insufficient stock for product ${productEntries[index].ref.id}.`)
      }

      transaction.update(productEntries[index].ref, {
        stock: currentStock - requestedQuantity,
      })
    })

    transaction.update(orderRef, {
      status: newStatus,
      stockDeductedAt: Date.now(),
    })
  })

  await addDoc(collection(db, ORDERS_COLLECTION, orderId, 'statusHistory'), {
    status: newStatus,
    timestamp: Date.now(),
    ...(note ? { note } : {}),
  } as OrderStatusHistoryEntry)
}

/**
 * পুরো status history রিটার্ন করে — order-এর প্রাথমিক "pending" অবস্থা (order ডকুমেন্টের
 * createdAt থেকে synthesize করা) + admin-added পরবর্তী সব entry (subcollection থেকে),
 * সময় অনুযায়ী পুরনো থেকে নতুন সাজানো।
 */
export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
  const order = await getOrderById(orderId)
  if (!order) return []

  const initialEntry: OrderStatusHistoryEntry = {
    status: 'pending',
    timestamp: order.createdAt,
  }

  const q = query(
    collection(db, ORDERS_COLLECTION, orderId, 'statusHistory'),
    orderBy('timestamp', 'asc')
  )
  const snapshot = await getDocs(q)
  const laterEntries = snapshot.docs.map((d) => d.data() as OrderStatusHistoryEntry)

  return [initialEntry, ...laterEntries]
}