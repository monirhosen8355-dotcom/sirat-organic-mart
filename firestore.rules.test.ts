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

describe('customer support', () => {
  const conversation = {
    customerId: 'customerA',
    customerName: 'Customer A',
    customerEmail: 'a@example.com',
    lastMessage: '',
    lastMessageAt: 100,
    unreadForAdmin: false,
    unreadForCustomer: false,
    createdAt: 100,
    updatedAt: 100,
  }

  it('public users can read FAQs but cannot write them', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'supportFAQs/faq1'), {
        question: 'How long does delivery take?',
        answer: 'Usually within two days.',
        active: true,
        order: 1,
      })
    })

    const guestDb = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(guestDb, 'supportFAQs/faq1')))
    await assertFails(setDoc(doc(guestDb, 'supportFAQs/faq2'), { question: 'Hack' }))
  })

  it('customer can access only their own conversation', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'supportConversations/customerA'), conversation)
    })

    const customerADb = testEnv.authenticatedContext('customerA').firestore()
    const customerBDb = testEnv.authenticatedContext('customerB').firestore()
    await assertSucceeds(getDoc(doc(customerADb, 'supportConversations/customerA')))
    await assertFails(getDoc(doc(customerBDb, 'supportConversations/customerA')))
    await assertFails(
      setDoc(doc(customerBDb, 'supportConversations/customerA'), {
        ...conversation,
        customerId: 'customerB',
      })
    )
  })

  it('customer can create a conversation only under their own UID', async () => {
    const customerDb = testEnv.authenticatedContext('customerA').firestore()
    await assertSucceeds(getDoc(doc(customerDb, 'supportConversations/customerA')))
    await assertSucceeds(
      setDoc(doc(customerDb, 'supportConversations/customerA'), conversation)
    )
    await assertFails(
      setDoc(doc(customerDb, 'supportConversations/customerB'), {
        ...conversation,
        customerId: 'customerA',
      })
    )
  })

  it('customer messages are isolated and immutable to customers', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'supportConversations/customerA'), conversation)
    })

    const customerADb = testEnv.authenticatedContext('customerA').firestore()
    const customerBDb = testEnv.authenticatedContext('customerB').firestore()
    const message = {
      conversationId: 'customerA',
      senderId: 'customerA',
      senderRole: 'customer',
      text: 'Can you help me?',
      createdAt: 200,
    }

    await assertSucceeds(
      setDoc(doc(customerADb, 'supportConversations/customerA/messages/m1'), message)
    )
    await assertSucceeds(
      getDoc(doc(customerADb, 'supportConversations/customerA/messages/m1'))
    )
    await assertFails(
      getDoc(doc(customerBDb, 'supportConversations/customerA/messages/m1'))
    )
    await assertFails(
      updateDoc(doc(customerADb, 'supportConversations/customerA/messages/m1'), {
        text: 'Changed',
      })
    )
  })

  it('admin can read conversations and send replies', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'admins/admin1'), { role: 'admin' })
      await setDoc(doc(ctx.firestore(), 'supportConversations/customerA'), conversation)
    })

    const adminDb = testEnv.authenticatedContext('admin1').firestore()
    await assertSucceeds(getDoc(doc(adminDb, 'supportConversations/customerA')))
    await assertSucceeds(
      setDoc(doc(adminDb, 'supportConversations/customerA/messages/admin1'), {
        conversationId: 'customerA',
        senderId: 'admin1',
        senderRole: 'admin',
        text: 'How can we help?',
        createdAt: 300,
      })
    )
    await assertSucceeds(
      updateDoc(doc(adminDb, 'supportConversations/customerA'), {
        lastMessage: 'How can we help?',
        unreadForCustomer: true,
      })
    )
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