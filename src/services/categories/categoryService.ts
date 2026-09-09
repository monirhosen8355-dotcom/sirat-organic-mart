import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { Category } from '../../types'

const CATEGORIES_COLLECTION = 'categories'

/**
 * সব active category, `order` অনুযায়ী সাজানো — সাধারণত হোমপেজ/নেভবারে ব্যবহার হবে।
 */
export async function getActiveCategories(): Promise<Category[]> {
  const q = query(
    collection(db, CATEGORIES_COLLECTION),
    where('active', '==', true),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)
}

/**
 * অ্যাডমিন প্যানেলের জন্য — active/inactive সবগুলো category।
 */
export async function getAllCategories(): Promise<Category[]> {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('order', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const ref = doc(db, CATEGORIES_COLLECTION, id)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Category) : null
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const q = query(collection(db, CATEGORIES_COLLECTION), where('slug', '==', slug))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() } as Category
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, CATEGORIES_COLLECTION), data)
  return ref.id
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, id), data)
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id))
}