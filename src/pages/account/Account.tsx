import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { LogOut, Package, MapPin, User as UserIcon } from 'lucide-react'
import { signOut } from 'firebase/auth'
import toast from 'react-hot-toast'
import { auth } from '../../lib/firebase/config'
import { useAuthStore } from '../../store/authStore'
import { getUserProfile } from '../../services/users/userService'
import type { UserProfile } from '../../types'
import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
import Button from '../../components/common/Button'

const Account = () => {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getUserProfile(user.uid)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch((err) => {
        if (!cancelled) toast.error('প্রোফাইল লোড করতে সমস্যা হয়েছে।')
        console.error(err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>আমার অ্যাকাউন্ট — Sirat Organic Mart</title>
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
          আমার অ্যাকাউন্ট
        </h1>

        <Card className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-natural-bg)]">
            <UserIcon className="h-6 w-6 text-[color:var(--color-emerald)]" />
          </div>
          <div>
            <p className="font-medium">{profile?.name ?? 'কাস্টমার'}</p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {profile?.phone}
            </p>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Link to="/account/orders">
            <Card hoverable className="flex items-center gap-3">
              <Package className="h-5 w-5 text-[color:var(--color-emerald)]" />
              <span className="font-medium">আমার অর্ডার</span>
            </Card>
          </Link>

          <Link to="/account/addresses">
            <Card hoverable className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[color:var(--color-emerald)]" />
              <span className="font-medium">সংরক্ষিত ঠিকানা</span>
            </Card>
          </Link>
        </div>

        <Button
          variant="outline"
          fullWidth
          className="mt-6"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={() => signOut(auth)}
        >
          লগআউট
        </Button>
      </div>
    </>
  )
}

export default Account