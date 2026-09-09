import { initMetaPixel, metaPixelPageView, metaPixelTrack } from './metaPixel'
import { initGA, gaPageView, gaTrack } from './ga'

// Meta Pixel আর GA4-এর ইভেন্ট নামের কনভেনশন আলাদা (PascalCase বনাম snake_case),
// তাই একটাই track() কল থেকে দুই জায়গায় সঠিক নামে পাঠানোর জন্য ম্যাপিং।
const GA_EVENT_NAME_MAP: Record<string, string> = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
}

export function initAnalytics(): void {
  initMetaPixel()
  initGA()
}

export function trackPageView(path: string): void {
  metaPixelPageView()
  gaPageView(path)
}

// Meta Pixel ইভেন্ট নাম (PascalCase) দিয়ে কল করতে হবে — যেমন track('Purchase', {...}) —
// ভেতরে ভেতরে GA4-এর জন্য সমতুল্য নামে ম্যাপ করে পাঠানো হয়।
export function track(eventName: string, params?: Record<string, unknown>): void {
  metaPixelTrack(eventName, params)
  gaTrack(GA_EVENT_NAME_MAP[eventName] ?? eventName, params)
}