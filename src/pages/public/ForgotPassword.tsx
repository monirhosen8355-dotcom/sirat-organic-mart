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
      setError('A password reset link could not be sent to this email address.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Password Reset — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mx-auto max-w-sm px-4 py-12">
        <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
          Password Reset
        </h1>

        {sent ? (
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            A password reset link has been sent to your email. Please check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
              disabled={isSubmitting}
            />
            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
              Send Reset Link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-[color:var(--color-emerald)] hover:underline">
            Return to Login
          </Link>
        </p>
      </div>
    </>
  )
}

export default ForgotPassword