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
      setError('Password must be at least 6 characters long.')
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
        setError('An account already exists with this email.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Register — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mx-auto max-w-sm px-4 py-12">
        <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
          Create an Account
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Mobile Number"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Password"
            type="password"
            hint="At least 6 characters"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            disabled={isSubmitting}
          />

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[color:var(--color-text-secondary)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[color:var(--color-emerald)]">
            Log In
          </Link>
        </p>
      </div>
    </>
  )
}

export default Register