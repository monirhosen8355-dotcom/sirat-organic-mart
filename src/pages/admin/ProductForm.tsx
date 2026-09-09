import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import {
  getProductById,
  createProduct,
  updateProduct,
} from '../../services/products/productService'
import { getAllCategories } from '../../services/categories/categoryService'
import { uploadMultipleImages } from '../../lib/cloudinary/upload'
import ReviewModeration from '../../components/admin/ReviewModeration'
import type { Category } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

interface ProductFormState {
  name: string
  slug: string
  shortDescription: string
  fullDescription: string
  price: string
  discountPrice: string
  stock: string
  sku: string
  categoryId: string
  images: string[]
  featured: boolean
  active: boolean
  seoTitle: string
  seoDescription: string
}

const emptyForm: ProductFormState = {
  name: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  price: '',
  discountPrice: '',
  stock: '',
  sku: '',
  categoryId: '',
  images: [],
  featured: false,
  active: true,
  seoTitle: '',
  seoDescription: '',
}

const ProductForm = () => {
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const categoryData = await getAllCategories()
        setCategories(categoryData)

        if (id) {
          const product = await getProductById(id)
          if (!product) {
            setLoadError('প্রোডাক্ট পাওয়া যায়নি।')
            return
          }
          setForm({
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            fullDescription: product.fullDescription,
            price: String(product.price),
            discountPrice: product.discountPrice ? String(product.discountPrice) : '',
            stock: String(product.stock),
            sku: product.sku,
            categoryId: product.categoryId,
            images: product.images,
            featured: product.featured,
            active: product.active,
            seoTitle: product.seoTitle ?? '',
            seoDescription: product.seoDescription ?? '',
          })
        } else if (categoryData.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: categoryData[0].id }))
        }
      } catch (err) {
        setLoadError('ডেটা লোড করতে সমস্যা হয়েছে।')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [id])

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEditMode ? prev.slug : slugify(name),
    }))
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setIsUploading(true)
    try {
      const results = await uploadMultipleImages(files)
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...results.map((r) => r.secureUrl)],
      }))
    } catch (err) {
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে।')
      console.error(err)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  function removeImage(url: string) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (
      !form.name.trim() ||
      !form.slug.trim() ||
      !form.sku.trim() ||
      !form.categoryId ||
      !form.price ||
      !form.stock
    ) {
      toast.error('নাম, স্লাগ, SKU, ক্যাটাগরি, দাম এবং স্টক আবশ্যক।')
      return
    }

    if (form.images.length === 0) {
      toast.error('অন্তত একটা ছবি যোগ করুন।')
      return
    }

    const price = Number(form.price)
    const stock = Number(form.stock)
    const discountPrice = form.discountPrice ? Number(form.discountPrice) : undefined

    if (Number.isNaN(price) || Number.isNaN(stock)) {
      toast.error('দাম এবং স্টক সংখ্যা হতে হবে।')
      return
    }

    if (discountPrice !== undefined && discountPrice >= price) {
      toast.error('ডিসকাউন্ট প্রাইস মূল দামের চেয়ে কম হতে হবে।')
      return
    }

    setIsSaving(true)
    try {
      const now = Date.now()
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription.trim(),
        price,
        discountPrice,
        stock,
        sku: form.sku.trim(),
        categoryId: form.categoryId,
        images: form.images,
        featured: form.featured,
        active: form.active,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        updatedAt: now,
      }

      if (isEditMode && id) {
        await updateProduct(id, payload)
        toast.success('প্রোডাক্ট আপডেট হয়েছে।')
      } else {
        await createProduct({ ...payload, createdAt: now })
        toast.success('নতুন প্রোডাক্ট তৈরি হয়েছে।')
      }

      navigate('/admin/products')
    } catch (err) {
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (loadError) {
    return <p className="py-16 text-center text-red-600">{loadError}</p>
  }

  return (
    <>
      <Helmet>
        <title>
          {isEditMode ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'} — Admin — Sirat Organic Mart
        </title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        {isEditMode ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যোগ করুন'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">মূল তথ্য</h2>

          <Input
            label="নাম"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isSaving}
          />

          <Input
            label="স্লাগ"
            required
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            hint="URL-এ ব্যবহার হবে, যেমন: /product/এই-স্লাগ"
            disabled={isSaving}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="SKU"
              required
              value={form.sku}
              onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
              disabled={isSaving}
            />

            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                ক্যাটাগরি<span className="ml-0.5 text-red-600">*</span>
              </label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                disabled={isSaving}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]"
              >
                <option value="" disabled>
                  ক্যাটাগরি বাছাই করুন
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="সংক্ষিপ্ত বিবরণ"
            required
            value={form.shortDescription}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, shortDescription: e.target.value }))
            }
            hint="প্রোডাক্ট কার্ডে দেখানো হবে"
            disabled={isSaving}
          />

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
              বিস্তারিত বিবরণ
            </label>
            <textarea
              rows={6}
              value={form.fullDescription}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fullDescription: e.target.value }))
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)] disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
              আপাতত সাধারণ টেক্সট — রিচ-টেক্সট এডিটর (react-quill/jodit-react) পরে যোগ করা
              যাবে।
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">দাম ও স্টক</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="দাম (৳)"
              type="number"
              required
              min={0}
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              disabled={isSaving}
            />
            <Input
              label="ডিসকাউন্ট প্রাইস (৳)"
              type="number"
              min={0}
              value={form.discountPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discountPrice: e.target.value }))
              }
              hint="ঐচ্ছিক"
              disabled={isSaving}
            />
            <Input
              label="স্টক"
              type="number"
              required
              min={0}
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              disabled={isSaving}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">ছবি</h2>

          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {form.images.map((url) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    disabled={isSaving}
                    aria-label="ছবি সরান"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={isSaving || isUploading}
              className="text-sm"
            />
            {isUploading && <Spinner size="sm" />}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">ফ্ল্যাগ</h2>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
              disabled={isSaving}
              className="h-4 w-4 rounded border-gray-300"
            />
            ফিচারড (হোমপেজে দেখাবে)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              disabled={isSaving}
              className="h-4 w-4 rounded border-gray-300"
            />
            অ্যাক্টিভ (স্টোরফ্রন্টে দেখাবে)
          </label>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">SEO (ঐচ্ছিক)</h2>

          <Input
            label="SEO টাইটেল"
            value={form.seoTitle}
            onChange={(e) => setForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
            disabled={isSaving}
          />
          <Input
            label="SEO বিবরণ"
            value={form.seoDescription}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, seoDescription: e.target.value }))
            }
            disabled={isSaving}
          />
        </Card>

        <div className="flex gap-3">
          <Button type="submit" isLoading={isSaving} disabled={isUploading}>
            সংরক্ষণ করুন
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/products')}
            disabled={isSaving}
          >
            বাতিল
          </Button>
        </div>
      </form>

      {isEditMode && id && (
        <div className="mt-6">
          <ReviewModeration productId={id} />
        </div>
      )}
    </>
  )
}

export default ProductForm