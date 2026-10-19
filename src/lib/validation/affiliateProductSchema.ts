import { z } from 'zod'

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const affiliateProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  slug: z.string().trim().min(1, 'Slug is required.'),
  sku: z.string().trim().min(1, 'SKU is required.'),
  categoryId: z.string(),
  shortDescription: z.string().trim(),
  fullDescription: z.string().trim(),
  images: z.array(z.string().url()).min(1, 'Fetch a product image before saving.').max(4),
  price: z.string().refine(
    (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
    'Price must be a non-negative number.'
  ),
  priceCurrency: z.string(),
  keywords: z.string(),
  tags: z.string(),
  affiliateUrl: z.string().min(1, 'Affiliate URL is required.').refine(
    isHttpUrl,
    'Enter a valid HTTP or HTTPS affiliate URL.'
  ),
})

export type AffiliateProductFormData = z.infer<typeof affiliateProductSchema>
