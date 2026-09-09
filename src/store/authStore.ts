import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase/config'

interface AuthState {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setIsAdmin: (isAdmin: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}))

/**
 * অ্যাপ লোড হওয়ার সময় একবার কল হবে (main.tsx থেকে)।
 * Firebase auth state পরিবর্তন হলেই store আপডেট হয়, সাথে admin কিনা যাচাই হয়।
 */
export function initAuthListener() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    useAuthStore.getState().setUser(firebaseUser)

    if (firebaseUser) {
      const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid))
      useAuthStore.getState().setIsAdmin(adminDoc.exists())
    } else {
      useAuthStore.getState().setIsAdmin(false)
    }

    useAuthStore.setState({ isLoading: false })
  })
}