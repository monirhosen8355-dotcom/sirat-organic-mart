import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, LayoutGrid, Sparkles, ChevronDown, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import { getActiveCategories } from '../../services/categories/categoryService'
import type { Category } from '../../types'
import BrandName from '../common/BrandName'

const Header = () => {
  const navigate = useNavigate()
  const itemCount = useCartStore((state) => state.itemCount())
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    getActiveCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats)
      })
      .catch((err) => {
        console.error('Failed to load categories:', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const categoryLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'whitespace-nowrap py-3 text-sm font-medium transition-colors',
      isActive
        ? 'text-[color:var(--color-emerald)]'
        : 'text-[color:var(--color-text-primary)] hover:text-[color:var(--color-emerald)]',
    ].join(' ')

  return (
    <header className="sticky top-0 z-40 hidden border-b border-gray-200 bg-white md:block">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-6">
        <Link
          to="/"
          className="flex-shrink-0 text-xl font-bold text-[color:var(--color-deep-green)]"
        >
          <BrandName />
        </Link>

        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Sparkles
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-emerald)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for any product..."
              aria-label="Search products"
              className="h-12 w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm focus:border-[color:var(--color-emerald)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[color:var(--color-emerald)]"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[color:var(--color-emerald)] text-white hover:opacity-90"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="flex flex-shrink-0 items-center gap-5">
          <Link
            to="/order-tracking"
            className="flex items-center gap-2 rounded-full p-2 text-[color:var(--color-deep-green)] hover:bg-gray-100"
            aria-label="Order Tracking"
          >
            <MapPin className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Order Tracking</span>
          </Link>

          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-full p-2 hover:bg-gray-100"
            aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
          >
            <span className="relative">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-emerald)] text-[10px] font-semibold text-white"
                  aria-hidden="true"
                >
                  {itemCount}
                </span>
              )}
            </span>
            <span className="hidden text-sm font-medium lg:inline">Cart</span>
          </Link>

          <Link
            to="/account"
            className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100"
          >
            <User className="h-5 w-5" aria-hidden="true" />
            <span className="hidden text-sm font-medium lg:inline">Account</span>
          </Link>
        </div>
      </div>

      {/* নিচের লাইন — All Categories ড্রপডাউন + dynamic category list */}
      <nav aria-label="ক্যাটাগরি" className="border-t border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6">
          <div className="relative flex-shrink-0" ref={categoryMenuRef}>
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 py-3 text-sm font-semibold text-[color:var(--color-deep-green)]"
              aria-expanded={isCategoryMenuOpen}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              All Categories
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {isCategoryMenuOpen && categories.length > 0 && (
              <div className="absolute left-0 top-full z-50 w-64 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setIsCategoryMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[color:var(--color-text-primary)] hover:bg-gray-50 hover:text-[color:var(--color-emerald)]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-6 overflow-x-auto">
              <NavLink to="/shop" end className={categoryLinkClass}>
                All Products
              </NavLink>
              {categories.map((cat) => (
                <NavLink key={cat.id} to={`/category/${cat.slug}`} className={categoryLinkClass}>
                  {cat.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header