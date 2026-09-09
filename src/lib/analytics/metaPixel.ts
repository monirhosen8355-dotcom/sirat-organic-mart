// Meta Pixel — Facebook-এর অফিসিয়াল বেস স্নিপেটের TypeScript ভার্সন।
// VITE_META_PIXEL_ID না থাকলে কিছুই init হবে না (dev এ pixel ছাড়াই কাজ করা যাবে)।

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[]
      loaded?: boolean
      version?: string
    }
    _fbq?: Window['fbq']
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined

export function initMetaPixel(): void {
  if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args)
    } else {
      fbq.queue?.push(args)
    }
  } as NonNullable<Window['fbq']>

  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  window.fbq = fbq
  window._fbq = fbq

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  window.fbq('init', PIXEL_ID)
}

export function metaPixelPageView(): void {
  window.fbq?.('track', 'PageView')
}

export function metaPixelTrack(eventName: string, params?: Record<string, unknown>): void {
  window.fbq?.('track', eventName, params)
}