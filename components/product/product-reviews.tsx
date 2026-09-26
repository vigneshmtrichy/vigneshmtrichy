'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Review = {
  id: number
  name: string
  rating: number
  comment: string
}

export function ProductReviews({
  productSlug,
}: {
  productSlug: string
}) {
  
const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
const [hasReviewed, setHasReviewed] = useState(false)
const [reviewError, setReviewError] = useState('')

useEffect(() => {
  const loadReviews = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUserId(user?.id ?? null)

    const { data, error } = await supabase
      .from('reviews')
      .select('id, name, rating, comment')
      .eq('product_slug', productSlug)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load reviews:', error)
      return
    }

    setReviews(data || [])

    if (user) {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_slug', productSlug)
        .eq('user_id', user.id)
        .maybeSingle()

      setHasReviewed(!!existingReview)

      const accountName = user.user_metadata?.full_name

      if (accountName) {
        setName(accountName)
      }
    }
  }

  loadReviews()
}, [productSlug])
 const submitReview = async () => {
  setReviewError('')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    router.push('/login')
    return
  }

  if (hasReviewed) {
    setReviewError(
      'You have already reviewed this product.',
    )
    return
  }

  if (!name.trim() || !comment.trim()) {
    return
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_slug: productSlug,
      user_id: user.id,
      name: name.trim(),
      rating,
      comment: comment.trim(),
    })
    .select('id, name, rating, comment')
    .single()

  if (error) {
    if (error.code === '23505') {
      setReviewError(
        'You have already reviewed this product.',
      )
    } else {
      console.error(
        'Failed to submit review:',
        error,
      )
      setReviewError(
        'Unable to submit review. Please try again.',
      )
    }

    return
  }

  if (data) {
    setReviews((current) => [data, ...current])
    setHasReviewed(true)
  }

  setName('')
  setRating(5)
  setComment('')
  setShowForm(false)
}
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) =>
              sum + review.rating,
            0,
          ) / reviews.length
        ).toFixed(1)
      : '0.0'

  return (
    <section className="px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-6xl">

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-background
            p-6
            md:p-8
          "
        >

          {/* TITLE */}
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.18em]
              text-accent
            "
          >
            Customer Reviews
          </p>

          {/* SUMMARY */}
          <div
            className="
              mt-4
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <div className="flex items-center gap-2">

                <span
                  className="
                    font-serif
                    text-3xl
                    font-bold
                    text-primary
                  "
                >
                  {averageRating}
                </span>

                <div className="flex gap-0.5">

                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <Star
                        key={star}
                        className="
                          h-5
                          w-5
                          fill-accent
                          text-accent
                        "
                      />
                    ),
                  )}

                </div>
              </div>

              <p
                className="
                  mt-1
                  text-sm
                  text-muted-foreground
                "
              >
                {reviews.length === 0
                  ? 'Be the first to review this product.'
                  : `Based on ${
                      reviews.length
                    } ${
                      reviews.length === 1
                        ? 'review'
                        : 'reviews'
                    }`}
              </p>
            </div>

            {/* WRITE REVIEW */}
           <button
  type="button"
  onClick={() => {
    if (!userId) {
      router.push('/login')
      return
    }

    if (hasReviewed) {
      setReviewError(
        'You have already reviewed this product.',
      )
      return
    }

    setReviewError('')
    setShowForm(
      (current) => !current,
    )
  }}
              className="
                rounded-full
                bg-primary
                px-6
                py-3
                text-sm
                font-semibold
                text-primary-foreground
                transition-opacity
                hover:opacity-90
              "
            >
              {showForm
  ? 'CANCEL'
  : hasReviewed
    ? 'REVIEW SUBMITTED'
    : 'WRITE A REVIEW'}
            </button>
            {reviewError && (
  <p className="mt-3 text-sm text-destructive">
    {reviewError}
  </p>
)}
          </div>

          {/* REVIEW FORM */}
          {showForm && (
            <div
              className="
                mt-6
                rounded-2xl
                border
                border-border
                bg-card/40
                p-5
              "
            >

              <h3
                className="
                  font-serif
                  text-xl
                  font-bold
                  text-primary
                "
              >
                Share your experience
              </h3>

              {/* NAME */}
              <div className="mt-5">

                <label
                  className="
                    text-sm
                    font-semibold
                    text-primary
                  "
                >
                  Your Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                  className="
                    mt-2
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-border
                    bg-background
                    px-4
                    text-sm
                    outline-none
                    focus:border-primary
                  "
                />
              </div>

              {/* RATING */}
              <div className="mt-5">

                <label
                  className="
                    text-sm
                    font-semibold
                    text-primary
                  "
                >
                  Rating
                </label>

                <div className="mt-2 flex gap-1">

                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setRating(star)
                        }
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`
                            h-7
                            w-7
                            ${
                              star <= rating
                                ? 'fill-accent text-accent'
                                : 'text-border'
                            }
                          `}
                        />
                      </button>
                    ),
                  )}

                </div>
              </div>

              {/* COMMENT */}
              <div className="mt-5">

                <label
                  className="
                    text-sm
                    font-semibold
                    text-primary
                  "
                >
                  Your Review
                </label>

                <textarea
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value)
                  }
                  placeholder="Tell us what you think..."
                  rows={4}
                  className="
                    mt-2
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-border
                    bg-background
                    p-4
                    text-sm
                    outline-none
                    focus:border-primary
                  "
                />
              </div>

              {/* SUBMIT */}
              <button
                type="button"
                onClick={submitReview}
                disabled={
                  !name.trim() ||
                  !comment.trim()
                }
                className="
                  mt-5
                  rounded-full
                  bg-primary
                  px-7
                  py-3
                  text-sm
                  font-semibold
                  text-primary-foreground
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                SUBMIT REVIEW
              </button>
            </div>
          )}

          {/* REVIEWS */}
          {reviews.length > 0 && (
            <div
              className="
                mt-7
                divide-y
                divide-border
                border-t
                border-border
              "
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="py-5"
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <div>

                      <p
                        className="
                          font-semibold
                          text-primary
                        "
                      >
                        {review.name}
                      </p>

                      <div className="mt-1 flex gap-0.5">

                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <Star
                              key={star}
                              className={`
                                h-4
                                w-4
                                ${
                                  star <=
                                  review.rating
                                    ? 'fill-accent text-accent'
                                    : 'text-border'
                                }
                              `}
                            />
                          ),
                        )}

                      </div>
                    </div>

                    <span
                      className="
                        rounded-full
                        border
                        border-border
                        px-3
                        py-1
                        text-[10px]
                        font-semibold
                        uppercase
                        text-muted-foreground
                      "
                    >
                      Customer Review
                    </span>
                  </div>

                  <p
                    className="
                      mt-3
                      text-sm
                      leading-6
                      text-muted-foreground
                    "
                  >
                    {review.comment}
                  </p>
                  

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  )
}