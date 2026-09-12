import { initMetaPixel, metaPixelPageView, metaPixelTrack } from './metaPixel'
import { initGA, gaPageView, gaTrack } from './ga'
import { getMetaPixelSettings } from '../../services/settings/metaPixelSettingsService'

// Meta Pixel আর GA4-এর ইভেন্ট নামের কনভেনশন আলাদা (PascalCase বনাম snake_case),
// তাই একটাই track() কল থেকে দুই জায়গায় সঠিক নামে পাঠানোর জন্য ম্যাপিং।
const GA_EVENT_NAME_MAP: Record<string, string> = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
}

export interface AnalyticsConfig {
  pixelId?: string | null
  enabled?: boolean
}

let currentAnalyticsConfig: AnalyticsConfig = {
  pixelId: undefined,
  enabled: true,
}

export function setAnalyticsConfig(config: AnalyticsConfig): void {
  currentAnalyticsConfig = {
    ...currentAnalyticsConfig,
    ...config,
  }

  initMetaPixel(currentAnalyticsConfig.pixelId, currentAnalyticsConfig.enabled)
}

export async function initAnalytics(): Promise<void> {
  try {
    const settings = await getMetaPixelSettings()
    if (settings) {
      currentAnalyticsConfig = {
        ...currentAnalyticsConfig,
        pixelId: settings.pixelId,
        enabled: settings.enabled,
      }
    } else {
      currentAnalyticsConfig = {
        ...currentAnalyticsConfig,
        pixelId: undefined,
        enabled: true,
      }
    }
  } catch (error) {
    console.warn('Meta Pixel settings load failed; falling back to defaults.', error)
  }

  initMetaPixel(currentAnalyticsConfig.pixelId, currentAnalyticsConfig.enabled)
  initGA()
}

export function trackPageView(path: string): void {
  if (currentAnalyticsConfig.enabled) {
    metaPixelPageView()
  }
  gaPageView(path)
}

// Meta Pixel ইভেন্ট নাম (PascalCase) দিয়ে কল করতে হবে — যেমন track('Purchase', {...}) —
// ভেতরে ভেতরে GA4-এর জন্য সমতুল্য নামে ম্যাপ করে পাঠানো হয়।
export function track(eventName: string, params?: Record<string, unknown>): void {
  if (currentAnalyticsConfig.enabled) {
    metaPixelTrack(eventName, params)
  }
  gaTrack(GA_EVENT_NAME_MAP[eventName] ?? eventName, params)
}