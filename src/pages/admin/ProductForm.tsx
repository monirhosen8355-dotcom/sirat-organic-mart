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
import { FormSkeleton } from '../../components/common/Skeleton'

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
  brand: string
  keywords: string
  tags: string
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
  brand: '',
  keywords: '',
  tags: '',
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
            setLoadError('Product not found.')
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
            brand: product.brand ?? '',
            keywords: product.keywords?.join(', ') ?? '',
            tags: product.tags?.join(', ') ?? '',
            featured: product.featured,
            active: product.active,
            seoTitle: product.seoTitle ?? '',
            seoDescription: product.seoDescription ?? '',
          })
        } else if (categoryData.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: categoryData[0].id }))
        }
      } catch (err) {
        setLoadError('There was a problem loading the data.')
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
    const remainingSlots = Math.max(0, 4 - form.images.length)
    const files = Array.from(e.target.files ?? []).slice(0, remainingSlots)
    if (files.length === 0) return

    if ((e.target.files?.length ?? 0) > remainingSlots) {
      toast.error('A product can have up to 4 images.')
    }

    setIsUploading(true)
    try {
      const results = await uploadMultipleImages(files)
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...results.map((r) => r.secureUrl)],
      }))
    } catch (err) {
      toast.error('Image upload failed.')
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
      toast.error('Name, slug, SKU, category, price, and stock are required.')
      return
    }

    if (form.images.length === 0) {
      toast.error('Please add at least one image.')
      return
    }

    const price = Number(form.price)
    const stock = Number(form.stock)
    const discountPrice = form.discountPrice ? Number(form.discountPrice) : undefined

    if (Number.isNaN(price) || Number.isNaN(stock)) {
      toast.error('Price and stock must be numeric values.')
      return
    }

    if (discountPrice !== undefined && discountPrice >= price) {
      toast.error('Discount price must be lower than the regular price.')
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
        brand: form.brand.trim() || undefined,
        keywords: form.keywords.split(',').map((value) => value.trim()).filter(Boolean),
        tags: form.tags.split(',').map((value) => value.trim()).filter(Boolean),
        featured: form.featured,
        active: form.active,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        updatedAt: now,
      }

      if (isEditMode && id) {
        await updateProduct(id, payload)
        toast.success('Product updated successfully.')
      } else {
        await createProduct({ ...payload, createdAt: now })
        toast.success('New product created successfully.')
      }

      navigate('/admin/products')
    } catch (err) {
      toast.error('There was a problem saving the product.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <FormSkeleton />
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
          {isEditMode ? 'Edit Product' : 'New Product'} — Admin — Shoplexᴮᴰ
        </title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        {isEditMode ? 'Edit product' : 'Add new product'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">Basic information</h2>

          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isSaving}
          />

          <Input
            label="Slug"
            required
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            hint="Used in the URL, for example: /product/this-slug"
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
                Category<span className="ml-0.5 text-red-600">*</span>
              </label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                disabled={isSaving}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]"
              >
                <option value="" disabled>
                  Select a category
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
            label="Short description"
            required
            value={form.shortDescription}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, shortDescription: e.target.value }))
            }
            hint="Shown on the product card"
            disabled={isSaving}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Brand"
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              disabled={isSaving}
            />
            <Input
              label="Keywords"
              value={form.keywords}
              onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value }))}
              hint="Comma-separated"
              disabled={isSaving}
            />
            <Input
              label="Tags"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              hint="Comma-separated"
              disabled={isSaving}
            />
          </div>

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
              Full description
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
              Plain text is used for now; a rich-text editor can be added later.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">Pricing & stock</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Price (৳)"
              type="number"
              required
              min={0}
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              disabled={isSaving}
            />
            <Input
              label="Discount price (৳)"
              type="number"
              min={0}
              value={form.discountPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discountPrice: e.target.value }))
              }
              hint="Optional"
              disabled={isSaving}
            />
            <Input
              label="Stock"
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
          <h2 className="font-medium">Images</h2>

          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Upload up to 4 accurate product images. The first image is used as the main image.
          </p>

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
                    aria-label="Remove image"
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
              disabled={isSaving || isUploading || form.images.length >= 4}
              className="text-sm"
            />
            {isUploading && <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-[color:var(--color-emerald)]/70" />}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">Flags</h2>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
              disabled={isSaving}
              className="h-4 w-4 rounded border-gray-300"
            />
            Featured (shown on homepage)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              disabled={isSaving}
              className="h-4 w-4 rounded border-gray-300"
            />
            Active (shown on storefront)
          </label>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">SEO (optional)</h2>

          <Input
            label="SEO title"
            value={form.seoTitle}
            onChange={(e) => setForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
            disabled={isSaving}
          />
          <Input
            label="SEO description"
            value={form.seoDescription}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, seoDescription: e.target.value }))
            }
            disabled={isSaving}
          />
        </Card>

        <div className="flex gap-3">
          <Button type="submit" isLoading={isSaving} disabled={isUploading}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/products')}
            disabled={isSaving}
          >
            Cancel
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