import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'

const Header = () => {
  const navigate = useNavigate()
  const itemCount = useCartStore((state) => state.itemCount())
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="hidden border-b border-gray-200 bg-white md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold text-[color:var(--color-deep-green)]">
          Sirat Organic Mart
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/shop" className="hover:text-[color:var(--color-emerald)]">
            শপ
          </Link>
          <Link to="/shop" className="hover:text-[color:var(--color-emerald)]">
            ক্যাটাগরি
          </Link>
        </nav>

        <form onSubmit={handleSearchSubmit} className="mx-6 max-w-md flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-secondary)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              aria-label="পণ্য খুঁজুন"
              className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-emerald)]"
            />
          </div>
        </form>

        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            className="relative rounded-full p-2 hover:bg-gray-100"
            aria-label={itemCount > 0 ? `কার্ট, ${itemCount}টি পণ্য আছে` : 'কার্ট'}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-emerald)] text-[10px] font-semibold text-white"
                aria-hidden="true"
              >
                {itemCount}
              </span>
            )}
          </Link>

          <Link
            to="/account"
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="অ্যাকাউন্ট"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header