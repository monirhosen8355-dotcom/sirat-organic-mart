import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { UserProfile, Address } from '../../types'

const USERS_COLLECTION = 'users'
const ADDRESSES_SUBCOLLECTION = 'addresses'

/**
 * নতুন রেজিস্ট্রেশনের পর ব্যবহারকারীর প্রোফাইল ডকুমেন্ট তৈরি করে।
 * Firebase Auth-এ অ্যাকাউন্ট তৈরির পরপরই কল হবে (Register পেজ থেকে, Phase 14)।
 */
export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt'>
): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, uid), {
    uid,
    ...data,
    createdAt: Date.now(),
  })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), data)
}

// ---------- Addresses ----------

export async function getUserAddresses(uid: string): Promise<Address[]> {
  const q = query(
    collection(db, USERS_COLLECTION, uid, ADDRESSES_SUBCOLLECTION),
    orderBy('label')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Address)
}

export async function addUserAddress(
  uid: string,
  data: Omit<Address, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, USERS_COLLECTION, uid, ADDRESSES_SUBCOLLECTION),
    data
  )
  return ref.id
}

export async function updateUserAddress(
  uid: string,
  addressId: string,
  data: Partial<Omit<Address, 'id'>>
): Promise<void> {
  await updateDoc(
    doc(db, USERS_COLLECTION, uid, ADDRESSES_SUBCOLLECTION, addressId),
    data
  )
}

export async function deleteUserAddress(uid: string, addressId: string): Promise<void> {
  await deleteDoc(doc(db, USERS_COLLECTION, uid, ADDRESSES_SUBCOLLECTION, addressId))
}

/**
 * অ্যাডমিন কাস্টমার লিস্ট পেজের জন্য (Phase 18) — সব কাস্টমার প্রোফাইল, নতুন থেকে পুরনো।
 * firestore.rules-এ users/{userId}-এর read rule (`isOwner(userId) || isAdmin()`)
 * প্রতিটা ডকুমেন্টের জন্য আলাদাভাবে যাচাই হয়, আর isAdmin() নির্দিষ্ট userId-নির্ভর নয় —
 * তাই admin থেকে কল করা এই collection-level query সম্পূর্ণ বৈধভাবে কাজ করবে।
 * এই ফাংশন শুধু AdminRoute দিয়ে গার্ড করা পেজ থেকেই কল হওয়া উচিত।
 */
export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => d.data() as UserProfile)
}