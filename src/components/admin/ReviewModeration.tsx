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
import { Skeleton } from '../common/Skeleton'

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
      setError('There was a problem loading reviews.')
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
      toast.success('Review approved successfully.')
      await loadReviews()
    } catch (err) {
      toast.error('There was a problem approving the review.')
      console.error(err)
    } finally {
      setApprovingId(null)
    }
  }

  async function handleDelete(review: Review) {
    if (!window.confirm(`Are you sure you want to delete the review from "${review.userName}"?`)) return

    setDeletingId(review.id)
    try {
      await deleteReview(productId, review.id)
      toast.success('Review deleted successfully.')
      await loadReviews()
    } catch (err) {
      toast.error('There was a problem deleting the review.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-medium">Review moderation</h2>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2 py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="py-6 text-center text-red-600">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color:var(--color-text-secondary)]">
          No reviews have been submitted for this product yet.
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
                    {review.approved ? 'Approved' : 'Pending review'}
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
                    aria-label="Approve review"
                  >
                    {approvingId === review.id ? (
                      <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-current/70" />
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
                  aria-label="Delete review"
                >
                  {deletingId === review.id ? (
                    <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-current/70" />
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