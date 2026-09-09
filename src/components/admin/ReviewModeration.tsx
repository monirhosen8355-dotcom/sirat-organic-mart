import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Star, Trash2 } from 'lucide-react'
import {
  getAllReviewsForProduct,
  approveReview,
  deleteReview,
} from '../../services/reviews/reviewService'
import type { Review } from '../../types'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Spinner from '../common/Spinner'

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface ReviewModerationProps {
  productId: string
}

const ReviewModeration = ({ productId }: ReviewModerationProps) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadReviews() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllReviewsForProduct(productId)
      setReviews(data)
    } catch (err) {
      setError('রিভিউ লোড করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function handleApprove(review: Review) {
    setApprovingId(review.id)
    try {
      await approveReview(productId, review.id)
      toast.success('রিভিউ অনুমোদন করা হয়েছে।')
      await loadReviews()
    } catch (err) {
      toast.error('অনুমোদন করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setApprovingId(null)
    }
  }

  async function handleDelete(review: Review) {
    if (!window.confirm(`"${review.userName}"-এর রিভিউটি ডিলিট করতে চান?`)) return

    setDeletingId(review.id)
    try {
      await deleteReview(productId, review.id)
      toast.success('রিভিউ ডিলিট হয়েছে।')
      await loadReviews()
    } catch (err) {
      toast.error('ডিলিট করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-medium">রিভিউ মডারেশন</h2>

      {isLoading ? (
        <div className="flex min-h-[15vh] items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-red-600">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color:var(--color-text-secondary)]">
          এই প্রোডাক্টে এখনো কোনো রিভিউ জমা পড়েনি।
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {reviews.map((review) => (
            <div key={review.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{review.userName}</p>
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5"
                        fill={i < review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </span>
                  <Badge variant={review.approved ? 'success' : 'neutral'}>
                    {review.approved ? 'অনুমোদিত' : 'পর্যালোচনাধীন'}
                  </Badge>
                  <span className="text-xs text-[color:var(--color-text-secondary)]">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[color:var(--color-text-primary)]">
                  {review.comment}
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                {!review.approved && (
                  <button
                    type="button"
                    onClick={() => handleApprove(review)}
                    disabled={approvingId === review.id}
                    className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                    aria-label="অনুমোদন করুন"
                  >
                    {approvingId === review.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(review)}
                  disabled={deletingId === review.id}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  aria-label="ডিলিট করুন"
                >
                  {deletingId === review.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default ReviewModeration