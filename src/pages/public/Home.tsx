import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Leaf, Truck, ShieldCheck } from 'lucide-react'
import { getFeaturedProducts } from '../../services/products/productService'
import { getActiveCategories } from '../../services/categories/categoryService'
import type { Product, Category } from '../../types'
import ProductCard from '../../components/product/ProductCard'
import Spinner from '../../components/common/Spinner'
import Card from '../../components/common/Card'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadHomeData() {
      try {
        const [products, cats] = await Promise.all([
          getFeaturedProducts(8),
          getActiveCategories(),
        ])
        if (!cancelled) {
          setFeaturedProducts(products)
          setCategories(cats)
        }
      } catch (err) {
        if (!cancelled) {
          setError('পণ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
          console.error(err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadHomeData()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>Sirat Organic Mart — প্রাকৃতিক ও অর্গানিক পণ্যের অনলাইন স্টোর</title>
        <meta
          name="description"
          content="Sirat Organic Mart — প্রাকৃতিক ও অর্গানিক পণ্যের বিশ্বস্ত অনলাইন স্টোর। ক্যাশ অন ডেলিভারিতে সহজে অর্ডার করুন।"
        />
        <meta property="og:title" content="Sirat Organic Mart" />
        <meta
          property="og:description"
          content="প্রাকৃতিক ও অর্গানিক পণ্যের বিশ্বস্ত অনলাইন স্টোর।"
        />
      </Helmet>

      {/* Hero */}
      <section className="bg-[color:var(--color-natural-bg)] px-4 py-12 text-center md:py-20">
        <h1 className="mx-auto mb-4 max-w-2xl text-2xl font-bold text-[color:var(--color-deep-green)] md:text-4xl">
          প্রাকৃতিক ও অর্গানিক পণ্য, সরাসরি আপনার দরজায়
        </h1>
        <p className="mx-auto mb-6 max-w-xl text-[color:var(--color-text-secondary)]">
          ক্যাশ অন ডেলিভারিতে সহজে অর্ডার করুন — বিশ্বস্ততা ও মান আমাদের অগ্রাধিকার
        </p>
        <Link
          to="/shop"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[color:var(--color-emerald)] px-6 font-medium text-white hover:bg-[color:var(--color-deep-green)]"
        >
          এখনই কেনাকাটা করুন
        </Link>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-deep-green)]">
            ক্যাটাগরি
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="flex min-w-[110px] flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 hover:border-[color:var(--color-emerald)]"
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-natural-bg)]">
                    <Leaf className="h-6 w-6 text-[color:var(--color-emerald)]" />
                  </div>
                )}
                <span className="text-center text-xs font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-deep-green)]">
          বৈশিষ্ট্যযুক্ত পণ্য
        </h2>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {!isLoading && error && (
          <p className="py-12 text-center text-red-600">{error}</p>
        )}

        {!isLoading && !error && featuredProducts.length === 0 && (
          <p className="py-12 text-center text-[color:var(--color-text-secondary)]">
            কোনো পণ্য পাওয়া যায়নি।
          </p>
        )}

        {!isLoading && !error && featuredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-deep-green)]">
          কেন Sirat Organic Mart বেছে নেবেন
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex flex-col items-center text-center">
            <Leaf className="mb-2 h-8 w-8 text-[color:var(--color-emerald)]" />
            <h3 className="mb-1 font-medium">১০০% প্রাকৃতিক</h3>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              সরাসরি বিশ্বস্ত উৎস থেকে সংগ্রহ করা।
            </p>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <Truck className="mb-2 h-8 w-8 text-[color:var(--color-emerald)]" />
            <h3 className="mb-1 font-medium">দ্রুত ডেলিভারি</h3>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              ক্যাশ অন ডেলিভারিতে ঝামেলাহীন অর্ডার।
            </p>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <ShieldCheck className="mb-2 h-8 w-8 text-[color:var(--color-emerald)]" />
            <h3 className="mb-1 font-medium">মান নিশ্চিতকরণ</h3>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              প্রতিটা পণ্য যাচাই করে পাঠানো হয়।
            </p>
          </Card>
        </div>
      </section>
    </>
  )
}

export default Home