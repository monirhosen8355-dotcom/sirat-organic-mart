import { useState } from 'react'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from './Button'

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>
}

const ReviewForm = ({ onSubmit }: ReviewFormProps) => {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!comment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(rating, comment.trim())
      setRating(0)
      setComment('')
      toast.success('Your review has been submitted and is awaiting approval')
    } catch (err) {
      console.error(err)
      toast.error('There was a problem submitting the review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
      <div>
        <span className="mb-1.5 block text-sm font-medium">Rating</span>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  className={[
                    'h-6 w-6',
                    value <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200',
                  ].join(' ')}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium">
          Comment
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Tell us about your experience with this product..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-emerald)]"
        />
      </div>

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Submit review
      </Button>
    </form>
  )
}

export default ReviewForm