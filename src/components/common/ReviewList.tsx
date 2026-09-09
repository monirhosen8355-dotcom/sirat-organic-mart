import { Star } from 'lucide-react'
import type { Review } from '../../types'

interface ReviewListProps {
  reviews: Review[]
}

const ReviewList = ({ reviews }: ReviewListProps) => {
  if (reviews.length === 0) {
    return (
      <p className="py-4 text-sm text-[color:var(--color-text-secondary)]">
        এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">{review.userName}</span>
            <div className="flex" aria-label={`${review.rating} এর মধ্যে ৫`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={[
                    'h-3.5 w-3.5',
                    i < review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-[color:var(--color-text-secondary)]">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}

export default ReviewList