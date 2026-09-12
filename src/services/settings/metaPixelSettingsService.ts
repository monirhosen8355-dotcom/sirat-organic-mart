import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { MetaPixelSettings } from '../../types'

const META_PIXEL_SETTINGS_COLLECTION = 'siteSettings'
const META_PIXEL_SETTINGS_DOC_ID = 'metaPixel'

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
