/**
 * scripts/seed-test-data.mjs
 *
 * শুধুমাত্র local/manual টেস্টিং-এর জন্য — production-এ চালানোর কথা না।
 * Phase 24-এ কুপন ফিচারের browser functional test করার জন্য Firestore-এ
 * একটা টেস্ট ক্যাটাগরি, একটা টেস্ট প্রোডাক্ট, আর একটা active টেস্ট কুপন বসায়।
 *
 * এটা Firebase Admin SDK ব্যবহার করে, যা security rules bypass করে সরাসরি
 * লিখতে পারে — তাই শুধু trusted service account credential দিয়ে চালানো উচিত,
 * কখনো client bundle-এ বা CI-তে committed credential দিয়ে না।
 *
 * চালানোর আগে:
 *   1. Firebase Console → Project Settings → Service Accounts → "Generate new
 *      private key" থেকে একটা JSON key ডাউনলোড করো।
 *   2. সেই ফাইলের path env var হিসেবে সেট করো:
 *        export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
 *   3. রুট থেকে চালাও:
 *        node scripts/seed-test-data.mjs
 *
 * চালানোর পর test-এর শেষে ডেটা মুছে ফেলতে:
 *        node scripts/seed-test-data.mjs --cleanup
 *
 * নোট: firebase-admin-এর ESM default export (`import admin from 'firebase-admin'`)
 * CommonJS interop সমস্যার কারণে `admin.credential`/`admin.firestore` undefined
 * দেয় — তাই এখানে ইচ্ছাকৃতভাবে 'firebase-admin/app' ও 'firebase-admin/firestore'
 * থেকে modular (named) import ব্যবহার করা হয়েছে, যেটা v13-এর সঠিক ESM পদ্ধতি।
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    '❌ GOOGLE_APPLICATION_CREDENTIALS সেট করা নেই। Firebase Console থেকে ' +
      'একটা service account key ডাউনলোড করে এই env var-এ path দাও।\n' +
      'উদাহরণ: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"'
  )
  process.exit(1)
}

initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()

const TEST_CATEGORY_ID = 'test-category-seed'
const TEST_PRODUCT_ID = 'test-product-seed'
const TEST_COUPON_ID = 'test-coupon-seed'

const isCleanup = process.argv.includes('--cleanup')

async function cleanup() {
  await Promise.all([
    db.collection('categories').doc(TEST_CATEGORY_ID).delete(),
    db.collection('products').doc(TEST_PRODUCT_ID).delete(),
    db.collection('coupons').doc(TEST_COUPON_ID).delete(),
  ])
  console.log('🧹 টেস্ট ডেটা মুছে ফেলা হয়েছে (category, product, coupon)।')
}

async function seed() {
  const now = Date.now()

  await db.collection('categories').doc(TEST_CATEGORY_ID).set({
    name: 'টেস্ট ক্যাটাগরি',
    slug: 'test-category',
    imageUrl: '',
    order: 999,
    active: true,
  })

  await db
    .collection('products')
    .doc(TEST_PRODUCT_ID)
    .set({
      name: 'টেস্ট প্রোডাক্ট (Seed)',
      slug: 'test-product-seed',
      shortDescription: 'শুধু coupon/checkout functional test-এর জন্য।',
      fullDescription:
        'এই প্রোডাক্টটা scripts/seed-test-data.mjs দিয়ে বসানো হয়েছে, শুধু ' +
        'browser-এ end-to-end checkout ও coupon flow টেস্ট করার জন্য। টেস্ট ' +
        'শেষে "node scripts/seed-test-data.mjs --cleanup" চালিয়ে মুছে ফেলো।',
      price: 500,
      stock: 100,
      sku: 'TEST-SKU-001',
      categoryId: TEST_CATEGORY_ID,
      images: [
        // চাইলে নিজের Cloudinary-এর কোনো placeholder ইমেজ URL এখানে বসাও;
        // খালি রাখলে UI-তে broken image দেখাবে কিন্তু checkout flow-এ কোনো
        // সমস্যা হবে না।
        '',
      ],
      featured: false,
      active: true,
      createdAt: now,
      updatedAt: now,
    })

  await db.collection('coupons').doc(TEST_COUPON_ID).set({
    code: 'TESTCOUPON10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    active: true,
    // expiresAt ইচ্ছাকৃতভাবে বাদ দেওয়া হলো (মানে কখনো expire করবে না)।
  })

  console.log('✅ টেস্ট ডেটা বসানো হয়েছে:')
  console.log('   - Category: /category/test-category')
  console.log('   - Product:  /product/test-product-seed (৳500)')
  console.log('   - Coupon:   TESTCOUPON10 (১০% ছাড়, কোনো মিনিমাম নেই)')
  console.log('')
  console.log('টেস্ট শেষে চালাও: node scripts/seed-test-data.mjs --cleanup')
}

const run = isCleanup ? cleanup : seed
run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ ব্যর্থ হয়েছে:', err)
    process.exit(1)
  })