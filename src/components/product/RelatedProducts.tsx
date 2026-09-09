import { useEffect, useState } from 'react'
import { getRelatedProducts } from '../../services/products/productService'
import type { Product } from '../../types'
import ProductCard from './ProductCard'
import Spinner from '../common/Spinner'

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

const RelatedProducts = ({ categoryId, currentProductId }: RelatedProductsProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    getRelatedProducts(categoryId, currentProductId)
      .then((results) => {
        if (!cancelled) setProducts(results)
      })
      .catch((err) => console.error('রিলেটেড প্রোডাক্ট লোড করতে সমস্যা:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [categoryId, currentProductId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-deep-green)]">
        সম্পর্কিত পণ্য
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default RelatedProducts