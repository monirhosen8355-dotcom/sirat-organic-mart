import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Ticket,
  FileText,
  LogOut,
  Radio,
  Image,
  Menu,
  X,
  Settings,
  MessageCircle,
} from 'lucide-react'
import { auth } from '../lib/firebase/config'
import BrandName from '../components/common/BrandName'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/home-banners', label: 'Homepage banners', icon: Image },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customer-support', label: 'Customer Support', icon: MessageCircle },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/settings', label: 'Meta Pixel', icon: Radio },
  { to: '/admin/site-settings', label: 'Site settings', icon: Settings },
  { to: '/admin/legal-pages', label: 'Legal pages', icon: FileText },
]

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  // route change হলে mobile drawer অটো close হয়ে যাবে, যাতে user আটকে না থাকে
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // drawer খোলা অবস্থায় background scroll বন্ধ থাকবে
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
        <span className="font-bold text-[color:var(--color-deep-green)]">
          <BrandName /> Admin
        </span>
        {/* mobile drawer-এর ভিতরের close (X) বাটন */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                isActive
                  ? 'bg-[color:var(--color-emerald)] text-white'
                  : 'text-[color:var(--color-text-primary)] hover:bg-gray-100',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => signOut(auth)}
        className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </>
  )

  return (
    <div className="flex min-h-screen items-start bg-[color:var(--color-natural-bg)]">
      {/* ---------- Desktop sidebar (আগের মতোই, অপরিবর্তিত) ---------- */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        {sidebarContent}
      </aside>

      {/* ---------- Mobile drawer sidebar ---------- */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!isSidebarOpen}
      >
        {sidebarContent}
      </aside>

      {/* ---------- Mobile overlay (drawer খোলা অবস্থায় বাইরে ক্লিক করলে বন্ধ হবে) ---------- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {/* ---------- Mobile top bar with hamburger ---------- */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg p-1.5 text-[color:var(--color-text-primary)] hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-[color:var(--color-deep-green)]">
            <BrandName /> Admin
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout