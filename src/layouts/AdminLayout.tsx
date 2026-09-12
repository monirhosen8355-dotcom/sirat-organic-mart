import { NavLink, Outlet } from 'react-router-dom'
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
} from 'lucide-react'
import { auth } from '../lib/firebase/config'

const navItems = [
  { to: '/admin', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'প্রোডাক্ট', icon: Package },
  { to: '/admin/categories', label: 'ক্যাটাগরি', icon: FolderTree },
  { to: '/admin/orders', label: 'অর্ডার', icon: ShoppingBag },
  { to: '/admin/customers', label: 'কাস্টমার', icon: Users },
  { to: '/admin/coupons', label: 'কুপন', icon: Ticket },
  { to: '/admin/settings', label: 'Meta Pixel', icon: Radio },
  { to: '/admin/legal-pages', label: 'লিগ্যাল পেজ', icon: FileText },
]

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-[color:var(--color-natural-bg)]">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-100 px-4 py-4">
          <span className="font-bold text-[color:var(--color-deep-green)]">
            Sirat Admin
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
          লগআউট
        </button>
      </aside>

      <div className="flex-1">
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout