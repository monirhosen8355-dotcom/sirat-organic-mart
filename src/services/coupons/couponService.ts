import {
  collection,
  doc,
  getDocs,
  query,
  where,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import { calculateCouponValidation } from '../../lib/coupons/calculateCouponValidation'
import type { Coupon } from '../../types'

const COUPONS_COLLECTION = 'coupons'

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  discountAmount: number
  couponCode?: string
  error?: string
}

export async function getAllCouponsAdmin(): Promise<Coupon[]> {
  const snapshot = await getDocs(collection(db, COUPONS_COLLECTION))

  return snapshot.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
      }) as Coupon
  )
}

export async function createCoupon(
  data: Omit<Coupon, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, COUPONS_COLLECTION), {
    ...data,
    code: data.code.trim().toUpperCase(),
  })

  return ref.id
}

export async function updateCoupon(
  id: string,
  data: Partial<Omit<Coupon, 'id'>>
): Promise<void> {
  const updateData = data.code
    ? {
        ...data,
        code: data.code.trim().toUpperCase(),
      }
    : data

  await updateDoc(doc(db, COUPONS_COLLECTION, id), updateData)
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COUPONS_COLLECTION, id))
}

/**
 * কাস্টমার checkout-এ কুপন কোড দিলে এই ফাংশন সরাসরি Firestore থেকে coupon doc
 * খুঁজে বের করে এবং client-side pure logic (calculateCouponValidation) দিয়ে
 * ছাড়ের পরিমাণ হিসাব করে। আগে এই কাজ একটা Cloud Function দিয়ে হতো; Blaze
 * billing activate না করার সিদ্ধান্তের কারণে এখন client-এ হচ্ছে।
 *
 * গুরুত্বপূর্ণ: Firestore rule অনুযায়ী শুধু active কুপন এই path দিয়ে পড়া যায়
 * (`resource.data.active == true`)। এই rule-টা যাতে query-level-এ statically
 * প্রমাণযোগ্য হয়, সেজন্য নিচের query-তেও অবশ্যই `where('active', '==', true)`
 * থাকতে হবে — শুধু `code` দিয়ে ফিল্টার করলে Firestore rule-টা প্রমাণ করতে না
 * পেরে পুরো query-ই permission-denied দিয়ে বাতিল করে দেয় (এমনকি valid, active
 * কুপনের ক্ষেত্রেও)। এই where clause সরালে পুরো কুপন ফিচার আবার ভেঙে যাবে।
 */
export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  try {
    const normalizedCode = code.trim().toUpperCase()

    if (!normalizedCode) {
      return {
        valid: false,
        discountAmount: 0,
        error: 'কুপন কোড দিন',
      }
    }

    const q = query(
      collection(db, COUPONS_COLLECTION),
      where('code', '==', normalizedCode),
      where('active', '==', true),
      limit(1)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return {
        valid: false,
        discountAmount: 0,
        error: 'কুপন কোডটি সঠিক নয়',
      }
    }

    const couponDoc = snapshot.docs[0]
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon

    const outcome = calculateCouponValidation(coupon, subtotal)

    if (!outcome.valid) {
      return {
        valid: false,
        discountAmount: 0,
        error: outcome.error,
      }
    }

    return {
      valid: true,
      coupon,
      discountAmount: outcome.discountAmount,
      couponCode: normalizedCode,
    }
  } catch (err) {
    console.error('কুপন ভ্যালিডেশন ব্যর্থ:', err)

    return {
      valid: false,
      discountAmount: 0,
      error: 'কুপন যাচাই করা যায়নি। আবার চেষ্টা করুন।',
    }
  }
}