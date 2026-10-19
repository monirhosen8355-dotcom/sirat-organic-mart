import { Link, useNavigate } from 'react-router-dom'
import { Search, Sparkles, MapPin } from 'lucide-react'
import { useState } from 'react'
import BrandName from '../common/BrandName'

const MobileHeader = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-gray-200 bg-white md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-12 items-center justify-between gap-3 px-4">
        <Link to="/" className="text-lg font-bold text-[color:var(--color-deep-green)]">
          <BrandName />
        </Link>
        <Link
          to="/order-tracking"
          className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-[color:var(--color-deep-green)] hover:bg-gray-100"
          aria-label="Order Tracking"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          <span>Order Tracking</span>
        </Link>
      </div>

      {/* নিচের লাইন — সবসময় দৃশ্যমান pill search (আগে toggle-এর পেছনে লুকানো ছিল) */}
      <form onSubmit={handleSearchSubmit} className="px-4 pb-3">
        <div className="relative">
          <Sparkles
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-emerald)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for any product..."
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-11 text-sm focus:border-[color:var(--color-emerald)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[color:var(--color-emerald)]"
          />
          <button
            type="submit"
            aria-label="খুঁজুন"
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[color:var(--color-emerald)] text-white"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </header>
  )
}

export default MobileHeader