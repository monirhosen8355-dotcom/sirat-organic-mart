// Firestore থেকে আলাদা করে রাখা "খাঁটি" (pure) কুপন যাচাই লজিক —
// কোনো Firestore/Admin SDK dependency নেই বলে সরাসরি unit test করা যায়।
// index.ts-এর validateCoupon Cloud Function শুধু কুপন ডকুমেন্ট খুঁজে বের করে
// এই ফাংশনকে কল করে, আসল হিসাব-নিকাশ এখানেই হয়।

export interface CouponRecord {
  active: boolean
  expiresAt?: number
  minOrderAmount?: number
  discountType: "percentage" | "fixed"
  discountValue: number
}

export interface CouponValidationOutcome {
  valid: boolean
  discountAmount: number
  error?: string
}

export function calculateCouponValidation(
  coupon: CouponRecord,
  subtotal: number,
  now: number = Date.now()
): CouponValidationOutcome {
  if (!coupon.active) {
    return {valid: false, discountAmount: 0, error: "এই কুপনটি আর সক্রিয় নেই"};
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return {valid: false, discountAmount: 0, error: "কুপনের মেয়াদ শেষ হয়ে গেছে"};
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      error: `এই কুপনের জন্য কমপক্ষে ৳${coupon.minOrderAmount} অর্ডার করতে হবে`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
  } else if (coupon.discountType === "fixed") {
    discountAmount = coupon.discountValue;
  }

  // ছাড় কখনো সাবটোটালের চেয়ে বেশি হবে না
  discountAmount = Math.min(discountAmount, subtotal);

  return {valid: true, discountAmount};
}
