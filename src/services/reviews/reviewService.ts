import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { Review } from '../../types'

/**
 * প্রোডাক্ট পেজে অনুমোদিত (approved) রিভিউ দেখানোর জন্য।
 */
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'products', productId, 'reviews'),
    where('approved', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Review)
}

/**
 * অ্যাডমিন মডারেশন প্যানেলের জন্য — সব রিভিউ (approved/unapproved), নতুন থেকে পুরনো।
 */
export async function getAllReviewsForProduct(productId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'products', productId, 'reviews'),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Review)
}

/**
 * কাস্টমার নতুন রিভিউ জমা দিলে — ডিফল্টভাবে unapproved থাকবে, অ্যাডমিন অনুমোদনের অপেক্ষায়
 * (firestore.rules-এ update শুধু admin-এর জন্য, তাই approve/reject admin panel থেকেই হবে)।
 */
export async function submitReview(
  productId: string,
  data: Omit<Review, 'id' | 'productId' | 'approved' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'products', productId, 'reviews'), {
    ...data,
    productId,
    approved: false,
    createdAt: Date.now(),
  })
  return ref.id
}

/**
 * অ্যাডমিন রিভিউ অনুমোদন করলে — এবং প্রোডাক্টের rating/reviewCount ক্যাশ আপডেট হয়,
 * যাতে প্রতিবার প্রোডাক্ট কার্ডে গড় রেটিং হিসাব করার জন্য সব রিভিউ ফেচ করতে না হয়।
 */
export async function approveReview(productId: string, reviewId: string): Promise<void> {
  await updateDoc(doc(db, 'products', productId, 'reviews', reviewId), { approved: true })
  await recalculateProductRating(productId)
}

export async function deleteReview(productId: string, reviewId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId, 'reviews', reviewId))
  await recalculateProductRating(productId)
}

/**
 * approved রিভিউর গড় রেটিং ও সংখ্যা হিসাব করে প্রোডাক্ট ডকুমেন্টে ক্যাশ করে।
 */
async function recalculateProductRating(productId: string): Promise<void> {
  const approved = await getApprovedReviews(productId)
  const reviewCount = approved.length
  const rating =
    reviewCount === 0
      ? 0
      : approved.reduce((sum, r) => sum + r.rating, 0) / reviewCount

  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, 'products', productId)
    transaction.update(productRef, { rating, reviewCount })
  })
}