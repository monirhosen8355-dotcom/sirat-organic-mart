import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sirat-wishlist'

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeWishlist(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage অনুপলব্ধ হলে চুপচাপ উপেক্ষা — অ্যাপ ভাঙবে না
  }
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([])

  useEffect(() => {
    setWishlist(readWishlist())
  }, [])

  const isFavorite = useCallback((productId: string) => wishlist.includes(productId), [wishlist])

  const toggleFavorite = useCallback((productId: string) => {
    setWishlist((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      writeWishlist(next)
      return next
    })
  }, [])

  return { wishlist, isFavorite, toggleFavorite }
}