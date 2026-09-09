import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { getLegalPage } from '../../services/legal/legalService'
import type { LegalPage, LegalPageSlug } from '../../types'
import Spinner from './Spinner'

interface LegalPageViewProps {
  slug: LegalPageSlug
  fallbackTitle: string
}

const LegalPageView = ({ slug, fallbackTitle }: LegalPageViewProps) => {
  const [page, setPage] = useState<LegalPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    getLegalPage(slug)
      .then((result) => {
        if (!cancelled) setPage(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setError('পেজ লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
          console.error('লিগ্যাল পেজ লোড করতে সমস্যা হয়েছে:', err)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="py-16 text-center text-red-600">{error}</p>
      </div>
    )
  }

  const title = page?.title || fallbackTitle

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Helmet>
        <title>{title} — Sirat Organic Mart</title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        {title}
      </h1>

      {page?.content ? (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-text-primary)]">
          {page.content}
        </div>
      ) : (
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          এই পেজের কন্টেন্ট এখনো যোগ করা হয়নি।
        </p>
      )}
    </div>
  )
}

export default LegalPageView