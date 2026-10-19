import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Leaf } from 'lucide-react'
import {
  getFeaturedProducts,
  getProductsByCategoryForHome,
} from '../../services/products/productService'
import { getActiveCategories } from '../../services/categories/categoryService'
import { getActiveBannersByPlacement } from '../../services/banners/bannerService'
import type { Product, Category, HomeBanner } from '../../types'
import ProductCard from '../../components/product/ProductCard'
import HeroBannerCarousel from '../../components/home/HeroBannerCarousel'
import { useWishlist } from '../../lib/wishlist/useWishlist'
import PromoBannerGrid from '../../components/home/PromoBannerGrid'
import PromoBannerStrip from '../../components/home/PromoBannerStrip'
import { HomePageSkeleton } from '../../components/common/Skeleton'

interface CategorySection {
  category: Category
  products: Product[]
}

const Home = () => {
  const { wishlist } = useWishlist()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [heroBanners, setHeroBanners] = useState<HomeBanner[]>([])
  const [middleBanners, setMiddleBanners] = useState<HomeBanner[]>([])
  const [tripleBanners, setTripleBanners] = useState<HomeBanner[]>([])
  const [categorySections, setCategorySections] = useState<CategorySection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadHomeData() {
      try {
        const [products, allCategories, hero, middle, triple] = await Promise.all([
          getFeaturedProducts(8),
          getActiveCategories(),
          getActiveBannersByPlacement('hero'),
          getActiveBannersByPlacement('middle'),
          getActiveBannersByPlacement('triple'),
        ])

        const homepageCategories = [...allCategories]
          .filter((cat) => cat.active && cat.showOnHomepage)
          .sort((a, b) => (a.homeOrder ?? 0) - (b.homeOrder ?? 0))

        const sectionData = await Promise.all(
          homepageCategories.map(async (category) => ({
            category,
            products: await getProductsByCategoryForHome(category.id, 4),
          }))
        )

        if (!cancelled) {
          setFeaturedProducts(products)
          setCategories(allCategories.filter((cat) => cat.active))
          setHeroBanners(hero)
          setMiddleBanners(middle)
          setTripleBanners(triple)
          setCategorySections(sectionData.filter((item) => item.products.length > 0))
        }
      } catch (err) {
        if (!cancelled) {
          setError('There was a problem loading the products. Please try again.')
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

  const sortedFeaturedProducts = [...featuredProducts].sort(
    (a, b) => Number(wishlist.includes(b.id)) - Number(wishlist.includes(a.id))
  )

  return (
    <>
      <Helmet>
        <title>Shoplexᴮᴰ — Natural and Organic Products Online</title>
        <meta
          name="description"
          content="Shoplexᴮᴰ — a trusted online store for natural and organic products. Shop easily with cash on delivery."
        />
        <meta property="og:title" content="Shoplexᴮᴰ" />
        <meta
          property="og:description"
          content="A trusted online store for natural and organic products."
        />
      </Helmet>

      {/* Hero Banner — admin panel থেকে ব্যানার সেট করা থাকলেই শুধু দেখাবে, না থাকলে কিছুই render হবে না */}
      {heroBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-4 md:pt-6">
          <HeroBannerCarousel banners={heroBanners} />
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-6 pb-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[color:var(--color-deep-green)]">
              Categories
            </h2>
            <Link
              to="/shop"
              className="text-sm font-medium text-[color:var(--color-emerald)] hover:text-[color:var(--color-deep-green)]"
            >
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="flex min-w-[90px] flex-col items-center gap-2"
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    className="h-16 w-16 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-natural-bg)] shadow-sm">
                    <Leaf className="h-6 w-6 text-[color:var(--color-emerald)]" />
                  </div>
                )}
                <span className="text-center text-xs font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {middleBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <PromoBannerGrid banners={middleBanners} />
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 pt-2 pb-6">
        <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-deep-green)]">
          Featured products
        </h2>

        {isLoading && <HomePageSkeleton />}

        {!isLoading && error && (
          <p className="py-12 text-center text-red-600">{error}</p>
        )}

        {!isLoading && !error && sortedFeaturedProducts.length === 0 && (
          <p className="py-12 text-center text-[color:var(--color-text-secondary)]">
            No products found.
          </p>
        )}

        {!isLoading && !error && sortedFeaturedProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {sortedFeaturedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {tripleBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <PromoBannerStrip banners={tripleBanners} />
        </section>
      )}

      {categorySections.length > 0 &&
        categorySections.map(({ category, products }) => (
          <section key={category.id} className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[color:var(--color-deep-green)]">
                {category.name}
              </h2>
              <Link
                to={`/category/${category.slug}`}
                className="text-sm font-medium text-[color:var(--color-emerald)] hover:text-[color:var(--color-deep-green)]"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
        <p className="mt-8 mb-2 text-center text-sm font-medium text-[color:var(--color-deep-green)]">
  🏷️ Use code <strong>SIRAT420</strong> to get up to 10% off
</p>
    </>
  )
}

export default Home