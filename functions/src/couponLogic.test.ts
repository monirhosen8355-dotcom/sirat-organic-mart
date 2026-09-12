import {describe, expect, it} from "vitest";
import {
  calculateCouponValidation,
  type CouponRecord,
} from "./couponLogic";

function baseCoupon(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    active: true,
    discountType: "percentage",
    discountValue: 10,
    ...overrides,
  };
}

describe("calculateCouponValidation", () => {
  it("inactive কুপন reject করে", () => {
    const result = calculateCouponValidation(baseCoupon({active: false}), 1000);
    expect(result.valid).toBe(false);
    expect(result.discountAmount).toBe(0);
    expect(result.error).toBeDefined();
  });

  it("মেয়াদ শেষ হওয়া কুপন reject করে", () => {
    const coupon = baseCoupon({expiresAt: 1000});
    const result = calculateCouponValidation(coupon, 1000, /* now */ 2000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("মেয়াদ");
  });

  it("মেয়াদ শেষ হওয়ার আগ পর্যন্ত কুপন valid থাকে", () => {
    const coupon = baseCoupon({expiresAt: 2000});
    const result = calculateCouponValidation(coupon, 1000, /* now */ 1999);
    expect(result.valid).toBe(true);
  });

  it("সর্বনিম্ন অর্ডার পরিমাণ পূরণ না হলে reject করে", () => {
    const coupon = baseCoupon({minOrderAmount: 500});
    const result = calculateCouponValidation(coupon, 300);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("৳500");
  });

  it("percentage discount সঠিকভাবে হিসাব করে এবং রাউন্ড করে", () => {
    const coupon = baseCoupon({discountType: "percentage", discountValue: 15});
    const result = calculateCouponValidation(coupon, 999);
    // 999 * 15 / 100 = 149.85 -> রাউন্ড করে 150
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(150);
  });

  it("fixed discount সরাসরি প্রয়োগ করে", () => {
    const coupon = baseCoupon({discountType: "fixed", discountValue: 100});
    const result = calculateCouponValidation(coupon, 1000);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(100);
  });

  it("ছাড় কখনো সাবটোটালের চেয়ে বেশি হয় না", () => {
    const coupon = baseCoupon({discountType: "fixed", discountValue: 500});
    const result = calculateCouponValidation(coupon, 200);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(200);
  });

  it("minOrderAmount ঠিক সাবটোটালের সমান হলেও valid থাকে", () => {
    const coupon = baseCoupon({minOrderAmount: 500});
    const result = calculateCouponValidation(coupon, 500);
    expect(result.valid).toBe(true);
  });
});
