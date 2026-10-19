import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebase/config'

export interface LinkPreview {
  title: string
  description: string
  imageUrl: string
  price?: number
  currency?: string
  finalUrl: string
  siteName: string
}

interface FetchLinkPreviewRequest {
  url: string
}

const fetchLinkPreviewCallable = httpsCallable<FetchLinkPreviewRequest, LinkPreview>(
  functions,
  'fetchLinkPreview'
)

export async function fetchAffiliatePreview(url: string): Promise<LinkPreview> {
  const result = await fetchLinkPreviewCallable({ url })
  return result.data
}
