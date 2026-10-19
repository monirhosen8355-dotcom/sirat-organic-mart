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
import { getAllCategories } from '../categories/categoryService'
import type { Product } from '../../types'

const PRODUCTS_COLLECTION = 'products'

function toProduct(id: string, data: DocumentData): Product {
  return { id, ...data, type: data.type ?? 'normal' } as Product
}

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
  const products = snapshot.docs.map((d) => toProduct(d.id, d.data()))

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
  return snapshot.docs.map((d) => toProduct(d.id, d.data()))
}

export async function getProductsByCategoryForHome(categoryId: string, limitCount = 4): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true),
    where('categoryId', '==', categoryId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => toProduct(d.id, d.data()))
}

export async function getProductById(id: string): Promise<Product | null> {
  const ref = doc(db, PRODUCTS_COLLECTION, id)
  const snap = await getDoc(ref)
  return snap.exists() ? toProduct(snap.id, snap.data()) : null
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
  return toProduct(d.id, d.data())
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
    .map((d) => toProduct(d.id, d.data()))
    .filter((p) => p.id !== excludeProductId)
    .slice(0, max)
}

const SEARCH_ALIASES: Record<string, string[]> = {
  honey: ['honey', 'modhu', 'modhuu', 'mou', 'madhu', 'মধু', 'মৌ'],
  modhu: ['honey', 'modhu', 'modhuu', 'mou', 'madhu', 'মধু', 'মৌ'],
  modhuu: ['honey', 'modhu', 'modhuu', 'mou', 'madhu', 'মধু', 'মৌ'],
  mou: ['honey', 'modhu', 'modhuu', 'mou', 'madhu', 'মধু', 'মৌ'],
  madhu: ['honey', 'modhu', 'modhuu', 'mou', 'madhu', 'মধু', 'মৌ'],
  মধু: ['honey', 'modhu', 'modhuu', 'mou', 'madhu', 'মধু', 'মৌ'],
  মৌ: ['honey', 'modhu', 'modhuu', 'mou', 'madhu', 'মধু', 'মৌ'],
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function searchTokens(value: string): string[] {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean)
}

function singularVariants(token: string): string[] {
  const variants = new Set([token])
  if (token.length > 4 && token.endsWith('ies')) variants.add(`${token.slice(0, -3)}y`)
  if (token.length > 4 && token.endsWith('es')) variants.add(token.slice(0, -2))
  if (token.length > 3 && token.endsWith('s')) variants.add(token.slice(0, -1))
  return [...variants]
}

function levenshteinDistance(first: string, second: string): number {
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index)

  for (let row = 1; row <= first.length; row += 1) {
    let diagonal = previous[0]
    previous[0] = row
    for (let column = 1; column <= second.length; column += 1) {
      const above = previous[column]
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (first[row - 1] === second[column - 1] ? 0 : 1)
      )
      diagonal = above
    }
  }

  return previous[second.length]
}

function tokenSimilarity(queryToken: string, candidateToken: string): number {
  if (queryToken === candidateToken) return 1
  if (
    queryToken.length >= 4 &&
    (candidateToken.includes(queryToken) || queryToken.includes(candidateToken))
  ) {
    return 0.84
  }

  const shortestLength = Math.min(queryToken.length, candidateToken.length)
  if (shortestLength < 3) return 0

  const distance = levenshteinDistance(queryToken, candidateToken)
  const similarity = 1 - distance / Math.max(queryToken.length, candidateToken.length)
  const allowedDistance = shortestLength <= 4 ? 1 : shortestLength <= 7 ? 2 : 3
  return distance <= allowedDistance ? similarity : 0
}

function queryVariants(token: string): string[] {
  const variants = new Set<string>()
  for (const variant of singularVariants(token)) {
    variants.add(variant)
    for (const alias of SEARCH_ALIASES[variant] ?? []) variants.add(alias)
  }
  return [...variants]
}

interface SearchField {
  value: string
  weight: number
}

function scoreProduct(product: Product, categoryName: string, query: string): number {
  const queryTokens = searchTokens(query)
  const fields: SearchField[] = [
    { value: product.name, weight: 100 },
    { value: product.brand ?? '', weight: 92 },
    { value: categoryName, weight: 86 },
    { value: product.keywords?.join(' ') ?? '', weight: 82 },
    { value: product.tags?.join(' ') ?? '', weight: 80 },
    { value: product.slug, weight: 76 },
    { value: product.shortDescription, weight: 58 },
    { value: product.fullDescription, weight: 42 },
    { value: product.seoTitle ?? '', weight: 38 },
    { value: product.seoDescription ?? '', weight: 32 },
  ]

  let score = 0
  let matchedTokens = 0

  for (const queryToken of queryTokens) {
    const variants = queryVariants(queryToken)
    let bestMatch = 0

    for (const field of fields) {
      const candidateTokens = searchTokens(field.value)
      for (const variant of variants) {
        for (const candidateToken of candidateTokens) {
          bestMatch = Math.max(bestMatch, tokenSimilarity(variant, candidateToken) * field.weight)
        }
      }
    }

    if (bestMatch >= 24) {
      matchedTokens += 1
      score += bestMatch
    }
  }

  const normalizedQuery = normalizeSearchText(query)
  const normalizedName = normalizeSearchText(product.name)
  if (normalizedName === normalizedQuery) score += 140
  else if (normalizedName.includes(normalizedQuery)) score += 75

  return matchedTokens === queryTokens.length ? score : 0
}

/**
 * Search active products locally after one Firestore read. Scoring combines
 * exact matches, aliases, typo similarity, plural handling, and weighted fields.
 */
export async function searchProducts(searchQuery: string, max = 20): Promise<Product[]> {
  const [snapshot, categories] = await Promise.all([
    getDocs(query(collection(db, PRODUCTS_COLLECTION), where('active', '==', true), limit(500))),
    getAllCategories(),
  ])
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const ranked = snapshot.docs
    .map((document) => toProduct(document.id, document.data()))
    .map((product) => ({
      product,
      score: scoreProduct(product, categoryNames.get(product.categoryId) ?? '', searchQuery),
    }))
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score)

  return ranked.slice(0, max).map(({ product }) => product)
}

/**
 * অ্যাডমিন প্যানেলের জন্য — active/inactive সব প্রোডাক্ট, নতুন থেকে পুরনো।
 */
export async function getAllProductsAdmin(): Promise<Product[]> {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => toProduct(d.id, d.data()))
}

export async function createProduct(
  data: Omit<Product, 'id' | 'type'> & { type?: Product['type'] }
): Promise<string> {
  const ref = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...data,
    type: data.type ?? 'normal',
  })
  return ref.id
}

export async function createAffiliateProduct(
  data: Omit<Product, 'id' | 'type' | 'sku' | 'stock'> & {
    affiliateUrl: string
    sku?: string
  }
): Promise<string> {
  const {sku, ...productData} = data
  return createProduct({
    ...productData,
    type: 'affiliate',
    sku: sku ?? `AFF-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`,
  })
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