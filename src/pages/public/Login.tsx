import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Helmet } from 'react-helmet-async'
import { auth } from '../../lib/firebase/config'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as { from?: Location })?.from?.pathname || '/account'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      setError('The email or password is incorrect.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mx-auto max-w-sm px-4 py-12">
        <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
          Log In
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            disabled={isSubmitting}
          />

          <Link
            to="/forgot-password"
            className="text-right text-sm text-[color:var(--color-emerald)] hover:underline"
          >
            Forgot password?
          </Link>

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[color:var(--color-text-secondary)]">
          Don’t have an account?{' '}
          <Link to="/register" className="font-medium text-[color:var(--color-emerald)]">
            Register
          </Link>
        </p>

        <p className="mt-2 text-center text-sm">
          <Link to="/shop" className="text-[color:var(--color-text-secondary)] underline">
            Continue shopping as a guest
          </Link>
        </p>
      </div>
    </>
  )
}

export default Login