import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {calculateCouponValidation, type CouponRecord} from "./couponLogic.js";
import {
  fetchLinkPreview as fetchPreview,
  LinkPreviewError,
  type LinkPreview,
} from "./linkPreview.js";

initializeApp();
const db = getFirestore();

interface ValidateCouponRequest {
  code: string
  subtotal: number
}

interface ValidateCouponResponse {
  valid: boolean
  discountAmount: number
  couponCode?: string
  error?: string
}

interface FetchLinkPreviewRequest {
  url: string
}

/**
 * কাস্টমার checkout-এ কুপন কোড দিলে এই callable function কল হবে।
 * অ্যাডমিন SDK ব্যবহার করে (firestore.rules বাইপাস করে, কারণ এটা সার্ভার-সাইড
 * ট্রাস্টেড কোড) — কুপন খুঁজে বের করে, বৈধতা (active, expiry, min order) যাচাই
 * করে, এবং সঠিক ছাড়ের পরিমাণ হিসাব করে রিটার্ন করে। ক্লায়েন্ট কখনো নিজে থেকে
 * ছাড়ের অঙ্ক ঠিক করতে পারবে না — এই ফাংশনই একমাত্র সত্যিকারের উৎস।
 */
export const validateCoupon = onCall<ValidateCouponRequest, Promise<ValidateCouponResponse>>(
  async (request) => {
    const {code, subtotal} = request.data;

    if (!code || typeof code !== "string") {
      throw new HttpsError("invalid-argument", "কুপন কোড দিন");
    }
    if (typeof subtotal !== "number" || subtotal <= 0) {
      throw new HttpsError("invalid-argument", "সঠিক সাবটোটাল দরকার");
    }

    const normalizedCode = code.trim().toUpperCase();

    const snapshot = await db
      .collection("coupons")
      .where("code", "==", normalizedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {valid: false, discountAmount: 0, error: "কুপন কোডটি সঠিক নয়"};
    }

    const couponDoc = snapshot.docs[0];
    const coupon = couponDoc.data();

    const outcome = calculateCouponValidation(coupon as CouponRecord, subtotal);

    if (!outcome.valid) {
      return {valid: false, discountAmount: 0, error: outcome.error};
    }

    return {
      valid: true,
      discountAmount: outcome.discountAmount,
      couponCode: normalizedCode,
    };
  }
);

export const fetchLinkPreview = onCall<FetchLinkPreviewRequest, Promise<LinkPreview>>(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in as an admin to fetch product previews.");
    }
    let isAdmin: boolean;
    try {
      const admin = await db.collection("admins").doc(request.auth.uid).get();
      isAdmin = admin.exists;
    } catch (error) {
      logger.error("Affiliate preview admin check failed", error);
      throw new HttpsError("unavailable", "Could not verify admin access. Please try again.");
    }
    if (!isAdmin) {
      throw new HttpsError("permission-denied", "Only admins can fetch product previews.");
    }
    if (!request.data || typeof request.data.url !== "string" || !request.data.url.trim()) {
      throw new HttpsError("invalid-argument", "Enter a product URL.");
    }

    try {
      return await fetchPreview(request.data.url);
    } catch (error) {
      if (error instanceof LinkPreviewError) {
        const code = error.code === "invalid-url" ?
          "invalid-argument" :
          error.code === "blocked" ?
            "failed-precondition" :
            error.code === "timeout" ?
              "deadline-exceeded" :
              error.code === "no-data" ?
                "not-found" :
                "unavailable";
        throw new HttpsError(code, error.message);
      }

      logger.error("Affiliate preview fetch failed unexpectedly", error);
      throw new HttpsError(
        "unavailable",
        "The product site could not be reached. Try again or edit the product details.",
      );
    }
  },
);
