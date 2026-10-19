import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FormSkeleton } from './Skeleton'

/**
 * অ্যাডমিন রুটের জন্য গার্ড (/admin/* — লগইন পেজ ছাড়া বাকি সব)।
 * লগইন করা না থাকলে বা admin না হলে /admin/login-এ পাঠিয়ে দেয়।
 * শুধু client-side redirect — আসল নিরাপত্তা firestore.rules-এর isAdmin() থেকেই আসে।
 */
const AdminRoute = () => {
  const { user, isAdmin, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <FormSkeleton />
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

export default AdminRoute