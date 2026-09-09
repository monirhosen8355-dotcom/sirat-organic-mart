import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Spinner from './Spinner'

/**
 * কাস্টমার অ্যাকাউন্ট রুটের জন্য গার্ড (/account, /account/orders ইত্যাদি)।
 * লগইন করা না থাকলে /login-এ পাঠিয়ে দেয়, লগইনের পর যেখান থেকে এসেছিল সেখানেই ফিরিয়ে নেয়।
 */
const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute