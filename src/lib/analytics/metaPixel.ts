// Meta Pixel — Facebook-এর অফিসিয়াল বেস স্নিপেটের TypeScript ভার্সন।
// ENV fallback ধরে রাখা হয়েছে, কিন্তু runtime-এ Firestore config-দিয়ে init করা যাবে
// এবং duplicate initialization বন্ধ থাকবে।

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

const LEGACY_PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim()

let metaPixelInitialized = false

function normalizePixelId(pixelId?: string | null): string | null {
  if (!pixelId) return null
  const value = pixelId.trim()
  return value.length > 0 ? value : null
}

export function initMetaPixel(pixelIdOverride?: string | null, enabled = true): void {
  if (typeof window === 'undefined') return

  const pixelId = normalizePixelId(pixelIdOverride) ?? normalizePixelId(LEGACY_PIXEL_ID)

  if (!enabled || !pixelId || metaPixelInitialized || window.fbq) return

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

  window.fbq('init', pixelId)
  metaPixelInitialized = true
}

export function metaPixelPageView(): void {
  if (!metaPixelInitialized || !window.fbq) return
  window.fbq('track', 'PageView')
}

export function metaPixelTrack(eventName: string, params?: Record<string, unknown>): void {
  if (!metaPixelInitialized || !window.fbq) return
  window.fbq('track', eventName, params)
}

export function resetMetaPixelInitializationForTesting(): void {
  metaPixelInitialized = false
}
