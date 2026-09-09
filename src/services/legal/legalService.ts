import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { LegalPage, LegalPageSlug } from '../../types'

const LEGAL_PAGES_COLLECTION = 'legalPages'

// প্রতিটা legal page-এর doc id-ই তার slug — যাতে সরাসরি getDoc দিয়ে
// এক কলে পড়া যায়, পুরো collection স্ক্যান করতে না হয়।
export async function getLegalPage(slug: LegalPageSlug): Promise<LegalPage | null> {
  const snapshot = await getDoc(doc(db, LEGAL_PAGES_COLLECTION, slug))
  if (!snapshot.exists()) return null
  return snapshot.data() as LegalPage
}

export async function getAllLegalPages(): Promise<LegalPage[]> {
  const snapshot = await getDocs(collection(db, LEGAL_PAGES_COLLECTION))
  return snapshot.docs.map((d) => d.data() as LegalPage)
}

export async function saveLegalPage(
  slug: LegalPageSlug,
  data: { title: string; content: string }
): Promise<void> {
  const payload: LegalPage = {
    slug,
    title: data.title,
    content: data.content,
    updatedAt: Date.now(),
  }
  await setDoc(doc(db, LEGAL_PAGES_COLLECTION, slug), payload)
}