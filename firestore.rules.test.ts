// @vitest-environment node
//
// এই টেস্টগুলো আসল Firestore নয়, লোকাল Firestore Emulator-এর বিরুদ্ধে চলে —
// তাই "firebase emulators:exec" দিয়ে চালাতে হয় (নিচে দেখুন), সরাসরি
// "vitest run" দিয়ে না। এটা firestore.rules ফাইলটাই লোড করে যাচাই করে,
// তাই rules.rules ফাইলে কোনো পরিবর্তন এলে এই টেস্টও তার প্রভাব ধরবে।
//
// চালানোর নিয়ম:
//   npm run test:rules
//
// প্রয়োজন: firebase-tools CLI (গ্লোবালি ইনস্টল করা থাকতে হবে — Phase 3/24-এ
// আগেই ব্যবহার করা হয়েছে) এবং Java (Firestore Emulator চালাতে লাগে)।

import { readFileSync } from 'node:fs'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'sirat-organic-mart-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

describe('products (public read, admin write)', () => {
  it('অ্যানোনিমাস ইউজার প্রোডাক্ট পড়তে পারে', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'products/p1'), { name: 'Honey' })
    })
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(guestDb, 'products/p1')))
  })

  it('non-admin সাইন-ইন করা ইউজারও প্রোডাক্ট লিখতে পারে না', async () => {
    const customerDb = testEnv.authenticatedContext('customerA').firestore()
    await assertFails(setDoc(doc(customerDb, 'products/p2'), { name: 'Fake' }))
  })

  it('admin প্রোডাক্ট লিখতে পারে', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'admins/admin1'), { role: 'admin' })
    })
    const adminDb = testEnv.authenticatedContext('admin1').firestore()
    await assertSucceeds(setDoc(doc(adminDb, 'products/p3'), { name: 'Real' }))
  })
})

describe('orders', () => {
  const validOrder = {
    status: 'pending',
    paymentMethod: 'cod',
    discount: 0,
    subtotal: 500,
    deliveryCharge: 80,
    total: 580,
    items: [{ productId: 'p1', quantity: 1 }],
  }

  it('guest সঠিক schema মেনে অর্ডার create করতে পারে', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(setDoc(doc(guestDb, 'orders/o1'), validOrder))
  })

  it('ভুয়া/ভুল total দিয়ে অর্ডার create করা যায় না', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertFails(
      setDoc(doc(guestDb, 'orders/o2'), { ...validOrder, total: 999999 })
    )
  })

  it('ঋণাত্মক discount দিয়ে অর্ডার create করা যায় না', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(guestDb, 'orders/o3'), { ...validOrder, discount: -50 }))
  })

  it('একজন কাস্টমার আরেকজনের অর্ডার পড়তে পারে না', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'orders/o4'), { ...validOrder, userId: 'customerA' })
    })
    const customerBDb = testEnv.authenticatedContext('customerB').firestore()
    await assertFails(getDoc(doc(customerBDb, 'orders/o4')))
  })

  it('কাস্টমার নিজের অর্ডার নিজে পড়তে পারে', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'orders/o5'), { ...validOrder, userId: 'customerA' })
    })
    const customerADb = testEnv.authenticatedContext('customerA').firestore()
    await assertSucceeds(getDoc(doc(customerADb, 'orders/o5')))
  })

  it('কাস্টমার নিজের অর্ডারের status নিজে বদলাতে পারে না', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'orders/o6'), { ...validOrder, userId: 'customerA' })
    })
    const customerADb = testEnv.authenticatedContext('customerA').firestore()
    await assertFails(updateDoc(doc(customerADb, 'orders/o6'), { status: 'delivered' }))
  })

  it('admin অর্ডারের status বদলাতে পারে', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'admins/admin1'), { role: 'admin' })
      await setDoc(doc(ctx.firestore(), 'orders/o7'), { ...validOrder, userId: 'customerA' })
    })
    const adminDb = testEnv.authenticatedContext('admin1').firestore()
    await assertSucceeds(updateDoc(doc(adminDb, 'orders/o7'), { status: 'delivered' }))
  })

  it('কেউ অর্ডার delete করতে পারে না (admin-ও না)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'admins/admin1'), { role: 'admin' })
      await setDoc(doc(ctx.firestore(), 'orders/o8'), validOrder)
    })
    const adminDb = testEnv.authenticatedContext('admin1').firestore()
    const { deleteDoc } = await import('firebase/firestore')
    await assertFails(deleteDoc(doc(adminDb, 'orders/o8')))
  })
})

describe('coupons (admin-only, never public)', () => {
  it('unauthenticated ইউজার কুপন পড়তে পারে না', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'coupons/c1'), { code: 'SAVE10' })
    })
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(guestDb, 'coupons/c1')))
  })

  it('unauthenticated ইউজার কুপন তৈরি করতে পারে না', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(guestDb, 'coupons/c2'), { code: 'HACK' }))
  })
})

describe('admins collection (never client-writable)', () => {
  it('কেউ নিজেকে নিজে admin বানাতে পারবে না', async () => {
    const sneakyDb = testEnv.authenticatedContext('sneaky').firestore()
    await assertFails(setDoc(doc(sneakyDb, 'admins/sneaky'), { role: 'admin' }))
  })

  it('admin নিজেও admins কালেকশনে লিখতে পারে না (Console-only)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await setDoc(doc(ctx.firestore(), 'admins/admin1'), { role: 'admin' })
    })
    const adminDb = testEnv.authenticatedContext('admin1').firestore()
    await assertFails(setDoc(doc(adminDb, 'admins/admin2'), { role: 'admin' }))
  })
})

describe('unauthenticated user reaching admin-only writes generally', () => {
  it('unauthenticated ইউজার categories লিখতে পারে না', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(guestDb, 'categories/cat1'), { name: 'Fake' }))
  })

  it('unauthenticated ইউজার legalPages লিখতে পারে না', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(guestDb, 'legalPages/about'), { title: 'Hacked' }))
  })
})