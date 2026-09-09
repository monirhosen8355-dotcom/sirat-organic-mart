import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Helmet } from 'react-helmet-async'
import { auth } from '../../lib/firebase/config'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch (err) {
      console.error(err)
      setError('এই ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো যায়নি।')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>পাসওয়ার্ড রিসেট — Sirat Organic Mart</title>
      </Helmet>

      <div className="mx-auto max-w-sm px-4 py-12">
        <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
          পাসওয়ার্ড রিসেট
        </h1>

        {sent ? (
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স চেক করুন।
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="ইমেইল"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
              disabled={isSubmitting}
            />
            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
              রিসেট লিংক পাঠান
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-[color:var(--color-emerald)] hover:underline">
            লগইনে ফিরে যান
          </Link>
        </p>
      </div>
    </>
  )
}

export default ForgotPassword