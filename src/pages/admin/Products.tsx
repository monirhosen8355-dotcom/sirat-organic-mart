import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Archive, Search } from 'lucide-react'
import {
  getAllProductsAdmin,
  archiveProduct,
  deleteProduct,
} from '../../services/products/productService'
import { getAllCategories } from '../../services/categories/categoryService'
import type { Product, Category } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'

const Products = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadData() {
    setIsLoading(true)
    setError(null)
    try {
      const [productData, categoryData] = await Promise.all([
        getAllProductsAdmin(),
        getAllCategories(),
      ])
      setProducts(productData)
      setCategories(categoryData)
    } catch (err) {
      setError('প্রোডাক্ট লোড করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const filteredProducts = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase()
    return products.filter((p) => {
      const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter
      const matchesSearch =
        !lowerQuery ||
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery)
      return matchesCategory && matchesSearch
    })
  }, [products, searchQuery, categoryFilter])

  async function handleArchive(product: Product) {
    if (!window.confirm(`"${product.name}" আর্কাইভ করতে চান? এটা স্টোরফ্রন্ট থেকে হাইড হয়ে যাবে।`))
      return

    setArchivingId(product.id)
    try {
      await archiveProduct(product.id)
      toast.success('প্রোডাক্ট আর্কাইভ হয়েছে।')
      await loadData()
    } catch (err) {
      toast.error('আর্কাইভ করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setArchivingId(null)
    }
  }

  async function handleDelete(product: Product) {
    if (
      !window.confirm(
        `"${product.name}" স্থায়ীভাবে ডিলিট করতে চান? এটা আর ফেরত আনা যাবে না।`
      )
    )
      return

    setDeletingId(product.id)
    try {
      await deleteProduct(product.id)
      toast.success('প্রোডাক্ট ডিলিট হয়েছে।')
      await loadData()
    } catch (err) {
      toast.error('ডিলিট করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Helmet>
        <title>প্রোডাক্ট ম্যানেজমেন্ট — Admin — Sirat Organic Mart</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          প্রোডাক্ট ম্যানেজমেন্ট
        </h1>
        <Link to="/admin/products/new">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            নতুন প্রোডাক্ট
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-secondary)]" />
          <Input
            placeholder="নাম বা SKU দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]"
        >
          <option value="all">সব ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : filteredProducts.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          কোনো প্রোডাক্ট পাওয়া যায়নি।
        </p>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs text-[color:var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">প্রোডাক্ট</th>
                <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                <th className="px-4 py-3 font-medium">দাম</th>
                <th className="px-4 py-3 font-medium">স্টক</th>
                <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                <th className="px-4 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100" />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-[color:var(--color-text-secondary)]">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {categoryNameById.get(product.categoryId) ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {product.discountPrice ? (
                      <span>
                        <span className="font-medium text-[color:var(--color-deep-green)]">
                          ৳{product.discountPrice}
                        </span>{' '}
                        <span className="text-xs text-[color:var(--color-text-secondary)] line-through">
                          ৳{product.price}
                        </span>
                      </span>
                    ) : (
                      <span>৳{product.price}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock <= 5 ? 'font-medium text-amber-600' : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={product.active ? 'success' : 'neutral'}>
                        {product.active ? 'অ্যাক্টিভ' : 'আর্কাইভড'}
                      </Badge>
                      {product.featured && <Badge variant="info">ফিচারড</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/products/${product.id}`}
                        className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-gray-100"
                        aria-label="এডিট করুন"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleArchive(product)}
                        disabled={archivingId === product.id || !product.active}
                        className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-40"
                        aria-label="আর্কাইভ করুন"
                      >
                        {archivingId === product.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label="ডিলিট করুন"
                      >
                        {deletingId === product.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

export default Products