import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Helmet } from 'react-helmet-async'
import { auth } from '../../lib/firebase/config'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)

      // লগইন সফল হলেও admin কিনা তা authStore-এর listener কিছুক্ষণের মধ্যে আপডেট করবে।
      // এখানে সরাসরি চেক করার দরকার নেই — AdminRoute গার্ড নিজেই non-admin হলে
      // ফিরিয়ে দেবে যদি ভুল করে কেউ এখানে ঢুকে যায়।
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error(err)
      setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়।')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>অ্যাডমিন লগইন — Sirat Organic Mart</title>
      </Helmet>

      <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-natural-bg)] px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="mb-1 text-lg font-semibold text-[color:var(--color-deep-green)]">
            অ্যাডমিন প্যানেল
          </h1>
          <p className="mb-6 text-sm text-[color:var(--color-text-secondary)]">
            Sirat Organic Mart — শুধু অনুমোদিত অ্যাডমিনদের জন্য
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="ইমেইল"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="পাসওয়ার্ড"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error ?? undefined}
              disabled={isSubmitting}
            />

            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
              লগইন করুন
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}

export default AdminLogin