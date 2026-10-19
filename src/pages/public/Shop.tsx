import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { getProducts, type ProductPage } from '../../services/products/productService'
import { getActiveCategories } from '../../services/categories/categoryService'
import type { Product, Category } from '../../types'
import ProductCard from '../../components/product/ProductCard'
import { ProductGridSkeleton } from '../../components/common/Skeleton'
import Button from '../../components/common/Button'

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<ProductPage['lastDoc']>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Categories load once
  useEffect(() => {
    getActiveCategories()
      .then(setCategories)
      .catch((err) => console.error('There was a problem loading categories:', err))
  }, [])

  // Products load on initial render and when the category changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    getProducts({ categoryId: selectedCategoryId ?? undefined })
      .then((page) => {
        if (!cancelled) {
          setProducts(page.products)
          setLastDoc(page.lastDoc)
          setHasMore(page.hasMore)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('There was a problem loading the products. Please try again.')
          console.error(err)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedCategoryId])

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    try {
      const page = await getProducts({
        categoryId: selectedCategoryId ?? undefined,
        startAfterDoc: lastDoc,
      })
      setProducts((prev) => [...prev, ...page.products])
      setLastDoc(page.lastDoc)
      setHasMore(page.hasMore)
    } catch (err) {
      console.error(err)
      toast.error('More products could not be loaded. Please try again.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Shop — Shoplexᴮᴰ</title>
        <meta name="description" content="All natural and organic products in one place." />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold text-[color:var(--color-deep-green)]">
          Shop
        </h1>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={[
                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium',
                selectedCategoryId === null
                  ? 'border-[color:var(--color-emerald)] bg-[color:var(--color-emerald)] text-white'
                  : 'border-gray-300 text-[color:var(--color-text-secondary)]',
              ].join(' ')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={[
                  'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium',
                  selectedCategoryId === cat.id
                    ? 'border-[color:var(--color-emerald)] bg-[color:var(--color-emerald)] text-white'
                    : 'border-gray-300 text-[color:var(--color-text-secondary)]',
                ].join(' ')}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="py-4">
            <ProductGridSkeleton count={4} />
          </div>
        )}

        {!isLoading && error && (
          <p className="py-16 text-center text-red-600">{error}</p>
        )}

        {!isLoading && !error && products.length === 0 && (
          <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
            No products found.
          </p>
        )}

        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

                        {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" isLoading={isLoadingMore} onClick={handleLoadMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}

        {/* এখানে নতুন লাইনটা বসাও 👇 */}
        <p className="mt-8 mb-2 text-center text-sm font-medium text-[color:var(--color-deep-green)]">
          🏷️ Use code <strong>SIRAT420</strong> to get up to 10% off
        </p>
      </div>
    </>
  )
}

export default Shop