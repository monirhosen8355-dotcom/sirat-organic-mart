import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { getProducts, type ProductPage } from '../../services/products/productService'
import { getCategoryBySlug } from '../../services/categories/categoryService'
import type { Product, Category as CategoryType } from '../../types'
import ProductCard from '../../components/product/ProductCard'
import { ProductGridSkeleton } from '../../components/common/Skeleton'
import Button from '../../components/common/Button'

const Category = () => {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<CategoryType | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [lastDoc, setLastDoc] = useState<ProductPage['lastDoc']>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setNotFound(false)

    async function load() {
      try {
        const cat = await getCategoryBySlug(slug!)
        if (cancelled) return

        if (!cat) {
          setNotFound(true)
          setIsLoading(false)
          return
        }

        setCategory(cat)
        const page = await getProducts({ categoryId: cat.id })
        if (cancelled) return
        setProducts(page.products)
        setLastDoc(page.lastDoc)
        setHasMore(page.hasMore)
      } catch (err) {
        if (!cancelled) {
          setError('There was a problem loading the products. Please try again.')
          console.error(err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  const handleLoadMore = async () => {
    if (!category) return
    setIsLoadingMore(true)
    try {
      const page = await getProducts({ categoryId: category.id, startAfterDoc: lastDoc })
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

  if (notFound) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-[color:var(--color-text-secondary)]">This category could not be found.</p>
        <Link to="/shop" className="text-[color:var(--color-emerald)] underline">
          Return to Shop
        </Link>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{category ? `${category.name} — Shoplexᴮᴰ` : 'Category'}</title>
        {category?.name && (
          <meta name="description" content={`Browse all products in the ${category.name} category.`} />
        )}
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold text-[color:var(--color-deep-green)]">
          {category?.name ?? '...'}
        </h1>

        {isLoading && (
          <div className="py-4">
            <ProductGridSkeleton count={4} />
          </div>
        )}

        {!isLoading && error && <p className="py-16 text-center text-red-600">{error}</p>}

        {!isLoading && !error && products.length === 0 && (
          <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
            No products were found in this category.
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
      </div>
    </>
  )
}

export default Category