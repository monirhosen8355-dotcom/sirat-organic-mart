import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useState } from 'react'

const MobileHeader = () => {
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
    }
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-gray-200 bg-white md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {showSearch ? (
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setShowSearch(false)}
              placeholder="পণ্য খুঁজুন..."
              aria-label="পণ্য খুঁজুন"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-emerald)]"
            />
          </form>
        ) : (
          <>
            <Link to="/" className="text-lg font-bold text-[color:var(--color-deep-green)]">
              Sirat Organic Mart
            </Link>
            <button
              onClick={() => setShowSearch(true)}
              aria-label="সার্চ"
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <Search className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default MobileHeader