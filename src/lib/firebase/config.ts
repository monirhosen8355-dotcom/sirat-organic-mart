import { initializeApp } from 'firebase/app'
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
]

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    throw new Error(
      `Firebase config-এ "${key}" মিসিং। .env ফাইল চেক করুন এবং dev server রিস্টার্ট করুন।`
    )
  }
}

export const app = initializeApp(firebaseConfig)
// getFirestore(app)-এর বদলে initializeFirestore + ignoreUndefinedProperties —
// নইলে createOrder()-এ userId (guest checkout-এ undefined), deliveryNote,
// variantId, couponCode-এর মতো ঐচ্ছিক ফিল্ড undefined থাকলেই addDoc() সরাসরি
// throw করত, ফলে guest checkout (এই সাইটের মূল ফ্লো) কখনো কমপ্লিট হতোই না।
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
export const auth = getAuth(app)
export const functions = getFunctions(app)

// শুধু Playwright E2E টেস্টের সময় (vite dev server-কে playwright.config.ts থেকে
// এই env var দিয়ে চালানো হয়) — সাধারণ dev/build-এ এই ব্লক কখনো চলে না, তাই
// আসল Firebase project অপরিবর্তিত/অস্পর্শিত থাকে।
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export let analytics: ReturnType<typeof getAnalytics> | undefined
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app)
  }
})