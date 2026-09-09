// GA4 — Google-এর অফিসিয়াল gtag.js স্নিপেটের TypeScript ভার্সন।
// VITE_GA_MEASUREMENT_ID না থাকলে কিছুই init হবে না।

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

// প্রজেক্টের .env-এ GA4/Firebase Analytics-এর জন্য VITE_FIREBASE_MEASUREMENT_ID
// আগে থেকেই রিজার্ভ করা ছিল (Phase 3) — সেটাই এখানে ব্যবহার করা হচ্ছে, নতুন কোনো
// env var যোগ করা হয়নি।
const GA_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined

export function initGA(): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  // SPA-তে route change নিজে থেকে page_view পাঠায় না বলে এখানে অটো-পাঠানো বন্ধ রাখা হলো —
  // route change হলে trackPageView() থেকে ম্যানুয়ালি page_view পাঠানো হয় (track.ts দেখুন)।
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
}

export function gaPageView(path: string): void {
  window.gtag?.('event', 'page_view', { page_path: path })
}

export function gaTrack(eventName: string, params?: Record<string, unknown>): void {
  window.gtag?.('event', eventName, params)
}