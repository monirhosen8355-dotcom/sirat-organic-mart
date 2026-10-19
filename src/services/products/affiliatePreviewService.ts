import { auth } from '../../lib/firebase/config'

export interface LinkPreview {
  title: string
  description: string
  imageUrl: string
  price?: number
  currency?: string
  finalUrl: string
  siteName: string
}

export async function fetchAffiliatePreview(url: string): Promise<LinkPreview> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Sign in as an admin to fetch product previews.')
  }

  const token = await user.getIdToken()
  const response = await fetch('/api/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  })
  const result: unknown = await response.json()

  if (!response.ok) {
    const message =
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      typeof result.error === 'string'
        ? result.error
        : 'The preview service could not process this link.'
    throw new Error(message)
  }

  return result as LinkPreview
}
