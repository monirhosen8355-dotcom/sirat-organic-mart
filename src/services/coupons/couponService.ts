import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../lib/firebase/config'
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
 * কাস্টমার checkout-এ কুপন কোড দিলে এই ফাংশন Cloud Function
 * (validateCoupon) কল করে। ছাড়ের পরিমাণ সার্ভারে হিসাব হয়।
 */
const validateCouponFn = httpsCallable<
  { code: string; subtotal: number },
  CouponValidationResult
>(functions, 'validateCoupon')

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  try {
    const result = await validateCouponFn({
      code,
      subtotal,
    })

    return result.data
  } catch (err) {
    console.error('কুপন ভ্যালিডেশন ব্যর্থ:', err)

    return {
      valid: false,
      discountAmount: 0,
      error: 'কুপন যাচাই করা যায়নি। আবার চেষ্টা করুন।',
    }
  }
}