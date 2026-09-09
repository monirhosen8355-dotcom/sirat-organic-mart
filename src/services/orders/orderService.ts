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
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { Order, OrderStatus, OrderStatusHistoryEntry } from '../../types'

const ORDERS_COLLECTION = 'orders'

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
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<void> {
  const { updateDoc } = await import('firebase/firestore')
  const orderRef = doc(db, ORDERS_COLLECTION, orderId)
  await updateDoc(orderRef, { status: newStatus })

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