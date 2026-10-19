import { Link, Outlet, useLocation } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import Header from './Header'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'
import Footer from './Footer'
import CustomerSupportChat from '../support/CustomerSupportChat'
import { useCartStore } from '../../store/cartStore'

const HIDDEN_FOOTER_PATHS = new Set(['/', '/search', '/shop', '/cart'])

const MainLayout = () => {
  const location = useLocation()
  const itemCount = useCartStore((state) => state.itemCount())
  const hideFooterOnMobile =
    window.innerWidth < 768 && HIDDEN_FOOTER_PATHS.has(location.pathname)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MobileHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      {!hideFooterOnMobile && <Footer />}

      <Link
        to="/cart"
        aria-label={`Cart, ${itemCount} items`}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[color:var(--color-emerald)] text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl md:bottom-6 md:right-6 md:h-16 md:w-16"
      >
        <ShoppingCart className="h-6 w-6 md:h-7 md:w-7" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {itemCount}
          </span>
        )}
      </Link>

      <CustomerSupportChat />

      <MobileBottomNav />
    </div>
  )
}

export default MainLayout