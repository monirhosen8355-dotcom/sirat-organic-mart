import type { Coupon } from '../../types'

// আগে এই logic `functions/src/couponLogic.ts`-এ ছিল এবং একটা Cloud Function
// (`validateCoupon`) থেকে কল হতো। Cloud Functions deploy করার জন্য Blaze
// (pay-as-you-go) billing plan বাধ্যতামূলক, যা আপাতত এই project-এ activate করা
// হচ্ছে না। তাই একই "pure" calculation logic এখন সরাসরি client-এ ব্যবহৃত হচ্ছে।
//
// এই ফাংশন কোনো Firestore/network call করে না — শুধু ইতিমধ্যে fetch করা coupon
// doc আর subtotal নিয়ে discount হিসাব করে। ফলে server আর client উভয় জায়গাতেই
// অবিকল একই আচরণ (এবং প্রয়োজনে ভবিষ্যতে আবার Cloud Function-এ ফিরিয়ে নেওয়াও সহজ)।

export interface CouponValidationOutcome {
  valid: boolean
  discountAmount: number
  error?: string
}

export function calculateCouponValidation(
  coupon: Coupon,
  subtotal: number,
  now: number = Date.now()
): CouponValidationOutcome {
  if (!coupon.active) {
    return { valid: false, discountAmount: 0, error: 'এই কুপনটি আর সক্রিয় নেই' }
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { valid: false, discountAmount: 0, error: 'কুপনের মেয়াদ শেষ হয়ে গেছে' }
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      error: `এই কুপনের জন্য কমপক্ষে ৳${coupon.minOrderAmount} অর্ডার করতে হবে`,
    }
  }

  let discountAmount = 0
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100)
  } else if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discountValue
  }

  // ছাড় কখনো সাবটোটালের চেয়ে বেশি হবে না
  discountAmount = Math.min(discountAmount, subtotal)

  return { valid: true, discountAmount }
}