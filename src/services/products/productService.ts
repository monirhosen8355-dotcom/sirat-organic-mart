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
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { Product } from '../../types'

const PRODUCTS_COLLECTION = 'products'

export interface ProductPage {
  products: Product[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

/**
 * Shop/Category লিস্টিং পেজের জন্য — active প্রোডাক্ট, pagination সহ।
 * `categoryId` দিলে সেই ক্যাটাগরিতে ফিল্টার হবে।
 */
export async function getProducts(options?: {
  categoryId?: string
  pageSize?: number
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null
}): Promise<ProductPage> {
  const pageSize = options?.pageSize ?? 12

  const constraints = [where('active', '==', true)]
  if (options?.categoryId) {
    constraints.push(where('categoryId', '==', options.categoryId))
  }

  let q = query(
    collection(db, PRODUCTS_COLLECTION),
    ...constraints,
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  )

  if (options?.startAfterDoc) {
    q = query(
      collection(db, PRODUCTS_COLLECTION),
      ...constraints,
      orderBy('createdAt', 'desc'),
      startAfter(options.startAfterDoc),
      limit(pageSize)
    )
  }

  const snapshot = await getDocs(q)
  const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)

  return {
    products,
    lastDoc: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === pageSize,
  }
}

/**
 * হোমপেজের "Featured Products" সেকশনের জন্য।
 */
export async function getFeaturedProducts(max = 8): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true),
    where('featured', '==', true),
    orderBy('createdAt', 'desc'),
    limit(max)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
}

export async function getProductById(id: string): Promise<Product | null> {
  const ref = doc(db, PRODUCTS_COLLECTION, id)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('slug', '==', slug),
    where('active', '==', true)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() } as Product
}

/**
 * Product Detail পেজের "Related Products" সেকশনের জন্য — একই ক্যাটাগরি, বর্তমান প্রোডাক্ট বাদে।
 */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  max = 4
): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true),
    where('categoryId', '==', categoryId),
    limit(max + 1)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Product)
    .filter((p) => p.id !== excludeProductId)
    .slice(0, max)
}

/**
 * Search পেজের জন্য বেসিক ক্লায়েন্ট-সাইড-ফ্রেন্ডলি সার্চ স্কেলেটন।
 * নোট: Firestore নেটিভ ফুল-টেক্সট সার্চ সাপোর্ট করে না — এই স্টাব active প্রোডাক্ট নিয়ে
 * আসে, ফিল্টারিং আপাতত কল করার সাইডে হবে। ভবিষ্যতে Algolia/Typesense লাগলে এখানেই বসবে।
 */
export async function searchProducts(searchQuery: string, max = 20): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true),
    orderBy('name'),
    limit(200) // reasonable upper bound to filter client-side against
  )
  const snapshot = await getDocs(q)
  const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
  const lower = searchQuery.trim().toLowerCase()
  if (!lower) return all.slice(0, max)
  return all.filter((p) => p.name.toLowerCase().includes(lower)).slice(0, max)
}

/**
 * অ্যাডমিন প্যানেলের জন্য — active/inactive সব প্রোডাক্ট, নতুন থেকে পুরনো।
 */
export async function getAllProductsAdmin(): Promise<Product[]> {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, PRODUCTS_COLLECTION), data)
  return ref.id
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), data)
}

/**
 * সরাসরি ডিলিট না করে সাধারণত `active: false` করে আর্কাইভ করাই ভালো (অর্ডার হিস্টরিতে
 * প্রোডাক্ট রেফারেন্স অক্ষত থাকার জন্য)। প্রয়োজনে হার্ড ডিলিটের জন্য এই ফাংশনও রাখা হলো।
 */
export async function archiveProduct(id: string): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { active: false })
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id))
}

export async function updateStock(id: string, stock: number): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { stock })
}