import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { MetaPixelSettings, SiteFooterSettings } from '../../types'

const META_PIXEL_SETTINGS_COLLECTION = 'siteSettings'
const META_PIXEL_SETTINGS_DOC_ID = 'metaPixel'
const FOOTER_SETTINGS_DOC_ID = 'footer'

export const DEFAULT_FOOTER_SETTINGS: SiteFooterSettings = {
  storeName: 'Shoplexᴮᴰ',
  description:
    'Fresh organic groceries, pantry essentials, and thoughtfully sourced products for healthier everyday living.',
  phone: '+880 1874-491006',
  email: 'siratquickiq@gmail.com',
  whatsapp: 'https://wa.me/8801874491006',
  facebook: 'https://www.facebook.com/profile.php?id=61593160602533',
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/',
  sections: [
    {
      title: 'Shop',
      links: [
        { label: 'Fresh Vegetables', href: '/shop' },
        { label: 'Organic Fruits', href: '/shop' },
        { label: 'Groceries', href: '/shop' },
      ],
    },
    {
      title: 'Customer Support',
      links: [
        { label: 'Contact Us', href: '/contact' },
        { label: 'Delivery Info', href: '/delivery-information' },
        { label: 'Returns & Refunds', href: '/returns-refunds' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
  ],
  paymentMethods: ['bKash', 'Nagad', 'Rocket', 'Visa', 'Mastercard'],
  trustItems: ['Cash on Delivery', 'Secure Payment', 'Trusted Shopping'],
  copyrightText: '© 2025 Shoplexᴮᴰ. All rights reserved.',
  updatedAt: Date.now(),
}

export async function getMetaPixelSettings(): Promise<MetaPixelSettings | null> {
  const snapshot = await getDoc(doc(db, META_PIXEL_SETTINGS_COLLECTION, META_PIXEL_SETTINGS_DOC_ID))
  if (!snapshot.exists()) return null

  return snapshot.data() as MetaPixelSettings
}

export async function saveMetaPixelSettings(data: {
  pixelId: string
  enabled: boolean
  updatedBy?: string
}): Promise<MetaPixelSettings> {
  const payload: MetaPixelSettings = {
    pixelId: data.pixelId.trim(),
    enabled: Boolean(data.enabled),
    updatedAt: Date.now(),
    updatedBy: data.updatedBy,
  }

  await setDoc(doc(db, META_PIXEL_SETTINGS_COLLECTION, META_PIXEL_SETTINGS_DOC_ID), payload)

  return payload
}

export async function getFooterSettings(): Promise<SiteFooterSettings> {
  const snapshot = await getDoc(doc(db, META_PIXEL_SETTINGS_COLLECTION, FOOTER_SETTINGS_DOC_ID))

  if (!snapshot.exists()) {
    await setDoc(doc(db, META_PIXEL_SETTINGS_COLLECTION, FOOTER_SETTINGS_DOC_ID), DEFAULT_FOOTER_SETTINGS)
    return DEFAULT_FOOTER_SETTINGS
  }

  const stored = snapshot.data() as Partial<SiteFooterSettings>
  return {
    ...DEFAULT_FOOTER_SETTINGS,
    ...stored,
    sections: Array.isArray(stored.sections) && stored.sections.length > 0 ? stored.sections : DEFAULT_FOOTER_SETTINGS.sections,
    paymentMethods:
      Array.isArray(stored.paymentMethods) && stored.paymentMethods.length > 0
        ? stored.paymentMethods
        : DEFAULT_FOOTER_SETTINGS.paymentMethods,
    trustItems:
      Array.isArray(stored.trustItems) && stored.trustItems.length > 0
        ? stored.trustItems
        : DEFAULT_FOOTER_SETTINGS.trustItems,
  }
}

export async function saveFooterSettings(data: SiteFooterSettings): Promise<SiteFooterSettings> {
  const payload: SiteFooterSettings = {
    ...DEFAULT_FOOTER_SETTINGS,
    ...data,
    storeName: data.storeName.trim() || DEFAULT_FOOTER_SETTINGS.storeName,
    description: data.description.trim() || DEFAULT_FOOTER_SETTINGS.description,
    phone: data.phone.trim() || DEFAULT_FOOTER_SETTINGS.phone,
    email: data.email.trim() || DEFAULT_FOOTER_SETTINGS.email,
    whatsapp: data.whatsapp.trim() || DEFAULT_FOOTER_SETTINGS.whatsapp,
    facebook: data.facebook.trim() || DEFAULT_FOOTER_SETTINGS.facebook,
    instagram: data.instagram.trim() || DEFAULT_FOOTER_SETTINGS.instagram,
    youtube: data.youtube.trim() || DEFAULT_FOOTER_SETTINGS.youtube,
    copyrightText: data.copyrightText.trim() || DEFAULT_FOOTER_SETTINGS.copyrightText,
    updatedAt: Date.now(),
    updatedBy: data.updatedBy,
    sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : DEFAULT_FOOTER_SETTINGS.sections,
    paymentMethods:
      Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0
        ? data.paymentMethods
        : DEFAULT_FOOTER_SETTINGS.paymentMethods,
    trustItems:
      Array.isArray(data.trustItems) && data.trustItems.length > 0
        ? data.trustItems
        : DEFAULT_FOOTER_SETTINGS.trustItems,
  }

  await setDoc(doc(db, META_PIXEL_SETTINGS_COLLECTION, FOOTER_SETTINGS_DOC_ID), payload)
  return payload
}
