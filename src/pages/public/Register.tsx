import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { Helmet } from 'react-helmet-async'
import { auth } from '../../lib/firebase/config'
import { createUserProfile } from '../../services/users/userService'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

const Register = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      return
    }

    setIsSubmitting(true)
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )
      await updateProfile(credential.user, { displayName: name.trim() })
      await createUserProfile(credential.user.uid, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      })
      navigate('/account', { replace: true })
    } catch (err: unknown) {
      console.error(err)
      const code = (err as { code?: string })?.code
      if (code === 'auth/email-already-in-use') {
        setError('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।')
      } else {
        setError('রেজিস্ট্রেশন করা যায়নি। আবার চেষ্টা করুন।')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>রেজিস্ট্রেশন — Sirat Organic Mart</title>
      </Helmet>

      <div className="mx-auto max-w-sm px-4 py-12">
        <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
          নতুন অ্যাকাউন্ট তৈরি করুন
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="পুরো নাম"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="মোবাইল নম্বর"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />
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
            hint="কমপক্ষে ৬ অক্ষর"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            disabled={isSubmitting}
          />

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            রেজিস্ট্রেশন করুন
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[color:var(--color-text-secondary)]">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="font-medium text-[color:var(--color-emerald)]">
            লগইন করুন
          </Link>
        </p>
      </div>
    </>
  )
}

export default Register