import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { HomeBanner } from '../../types'

const BANNERS_COLLECTION = 'homeBanners'

/**
 * শুধু active banner, `order` অনুযায়ী সাজানো — Home page-এ ব্যবহার হবে।
 */
export async function getActiveBanners(): Promise<HomeBanner[]> {
  const q = query(
    collection(db, BANNERS_COLLECTION),
    where('active', '==', true),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeBanner)
}

export async function getActiveBannersByPlacement(placement: 'hero' | 'middle' | 'triple'): Promise<HomeBanner[]> {
  const q = query(
    collection(db, BANNERS_COLLECTION),
    where('active', '==', true),
    where('placement', '==', placement),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeBanner)
}

/**
 * অ্যাডমিন প্যানেলের জন্য — active/inactive সবগুলো banner।
 */
export async function getAllBanners(): Promise<HomeBanner[]> {
  const q = query(collection(db, BANNERS_COLLECTION), orderBy('order', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeBanner)
}

export async function createBanner(data: Omit<HomeBanner, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, BANNERS_COLLECTION), data)
  return ref.id
}

export async function updateBanner(
  id: string,
  data: Partial<Omit<HomeBanner, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, BANNERS_COLLECTION, id), data)
}

export async function deleteBanner(id: string): Promise<void> {
  await deleteDoc(doc(db, BANNERS_COLLECTION, id))
}