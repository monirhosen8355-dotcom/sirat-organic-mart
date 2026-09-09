// এই ফাইলটা পুরো E2E সুইট চালানোর আগে একবার চলে (playwright.config.ts-এর
// globalSetup)। এখানে যা করা হয়:
//   ১. Firestore Emulator-এ একটা টেস্ট প্রোডাক্ট বসানো হয় (rules bypass করে,
//      কারণ security rules-এ productর write শুধু admin-এর জন্য)
//   ২. Auth Emulator-এ একটা টেস্ট অ্যাডমিন অ্যাকাউন্ট বানানো হয়, এবং
//      admins/{uid} ডকুমেন্ট বসিয়ে তাকে সত্যিকারের admin বানানো হয়
//
// আসল প্রজেক্টের Firestore/Auth-এ কোনো প্রভাব পড়ে না — সবটাই local emulator-এ।

import { initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, connectAuthEmulator, getAuth } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { initializeTestEnvironment, type RulesTestContext } from '@firebase/rules-unit-testing'
import { E2E_PROJECT_ID, TEST_ADMIN, TEST_PRODUCT } from './fixtures.js'

export default async function globalSetup() {
  // ---------- ১. টেস্ট প্রোডাক্ট সিড করা ----------
  const testEnv = await initializeTestEnvironment({
    projectId: E2E_PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
    },
  })

  await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    const firestore = ctx.firestore()

    // ProductForm-এর ক্যাটাগরি <select required> ফিল্ডের জন্য একটা মিলে-যাওয়া
    // category doc লাগবে, নইলে সিড করা প্রোডাক্টের categoryId কোনো <option>-এর
    // সাথে না মিলে ফর্ম submit আটকে দেবে (native HTML5 required validation)।
    await setDoc(doc(firestore, 'categories', 'e2e-test-category'), {
      id: 'e2e-test-category',
      name: 'E2E টেস্ট ক্যাটাগরি',
      slug: 'e2e-test-category',
      active: true,
      order: 1,
    })

    await setDoc(doc(firestore, 'products', TEST_PRODUCT.id), {
      id: TEST_PRODUCT.id,
      name: TEST_PRODUCT.name,
      slug: TEST_PRODUCT.slug,
      shortDescription: 'Playwright E2E টেস্টের জন্য সিড করা প্রোডাক্ট',
      fullDescription: 'Playwright E2E টেস্টের জন্য সিড করা প্রোডাক্ট',
      price: TEST_PRODUCT.price,
      stock: TEST_PRODUCT.stock,
      sku: 'E2E-TEST-SKU-001',
      images: ['https://placehold.co/600x400?text=E2E+Test+Product'],
      categoryId: 'e2e-test-category',
      active: true,
      featured: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })

  await testEnv.cleanup()

  // ---------- ২. টেস্ট অ্যাডমিন অ্যাকাউন্ট তৈরি ----------
  const app = initializeApp({
    projectId: E2E_PROJECT_ID,
    apiKey: 'e2e-fake-api-key',
  })
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

  const credential = await createUserWithEmailAndPassword(
    auth,
    TEST_ADMIN.email,
    TEST_ADMIN.password
  )
  const adminUid = credential.user.uid

  // ---------- ৩. admins/{uid} ডকুমেন্ট বসিয়ে সত্যিকারের admin বানানো ----------
  const testEnv2 = await initializeTestEnvironment({
    projectId: E2E_PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
    },
  })

  await testEnv2.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await setDoc(doc(ctx.firestore(), 'admins', adminUid), {
      email: TEST_ADMIN.email,
      role: 'admin',
    })
  })

  await testEnv2.cleanup()
}