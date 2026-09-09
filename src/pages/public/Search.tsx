import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search as SearchIcon } from 'lucide-react'
import { searchProducts } from '../../services/products/productService'
import type { Product } from '../../types'
import ProductCard from '../../components/product/ProductCard'
import Spinner from '../../components/common/Spinner'
import Input from '../../components/common/Input'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(queryFromUrl)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInputValue(queryFromUrl)

    if (!queryFromUrl.trim()) {
      setProducts([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    searchProducts(queryFromUrl)
      .then((results) => {
        if (!cancelled) setProducts(results)
      })
      .catch((err) => {
        if (!cancelled) {
          setError('সার্চ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
          console.error(err)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [queryFromUrl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(inputValue.trim() ? { q: inputValue.trim() } : {})
  }

  return (
    <>
      <Helmet>
        <title>সার্চ — Sirat Organic Mart</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={handleSubmit} className="mb-6 max-w-md">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
          />
        </form>

        {!queryFromUrl.trim() && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-[color:var(--color-text-secondary)]">
            <SearchIcon className="h-10 w-10 opacity-40" />
            <p>পণ্য খুঁজতে উপরে লিখুন</p>
          </div>
        )}

        {queryFromUrl.trim() && isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {queryFromUrl.trim() && !isLoading && error && (
          <p className="py-16 text-center text-red-600">{error}</p>
        )}

        {queryFromUrl.trim() && !isLoading && !error && products.length === 0 && (
          <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
            কোনো পণ্য পাওয়া যায়নি।
          </p>
        )}

        {queryFromUrl.trim() && !isLoading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const SearchTextInputForm = Search
export default SearchTextInputForm