import { NavLink } from 'react-router-dom'
import { Home, Store, Search, ShoppingCart, User } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/shop', label: 'Shop', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/account', label: 'Account', icon: User },
]

const MobileBottomNav = () => {
  const itemCount = useCartStore((state) => state.itemCount())

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map(({ to, label, icon: Icon }, index) => {
          const isCart = to === '/cart'
          const isShop = index === 2
          const accessibleLabel =
            isCart && itemCount > 0 ? `${label}, ${itemCount} items` : label

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={accessibleLabel}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px]',
                  isShop ? 'min-w-[68px] -translate-y-0.5 px-3 py-2' : 'min-w-[56px]',
                  isActive
                    ? 'text-[color:var(--color-emerald)]'
                    : 'text-[color:var(--color-text-secondary)]',
                ].join(' ')
              }
            >
              <span className="relative" aria-hidden="true">
                <Icon className={isShop ? 'h-6 w-6' : 'h-5 w-5'} />
                {isCart && itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-emerald)] text-[9px] font-semibold text-white">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className={isShop ? 'text-[12px]' : ''}>{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav