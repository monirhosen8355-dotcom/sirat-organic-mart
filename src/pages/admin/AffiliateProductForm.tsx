import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import {
  createAffiliateProduct,
  getProductById,
  updateProduct,
} from '../../services/products/productService'
import { fetchAffiliatePreview, type LinkPreview } from '../../services/products/affiliatePreviewService'
import { getAllCategories } from '../../services/categories/categoryService'
import { uploadRemoteImageToCloudinary } from '../../lib/cloudinary/upload'
import { affiliateProductSchema, type AffiliateProductFormData } from '../../lib/validation/affiliateProductSchema'
import type { Category } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { FormSkeleton } from '../../components/common/Skeleton'

const emptyForm: AffiliateProductFormData = {
  name: '',
  slug: '',
  sku: '',
  categoryId: '',
  shortDescription: '',
  fullDescription: '',
  images: [],
  price: '',
  priceCurrency: '',
  keywords: '',
  tags: '',
  affiliateUrl: '',
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

function splitValues(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function errorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'functions/internal'
  ) {
    return 'The preview service could not process this link. Try again or edit the details manually.'
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

function generateAffiliateSku(): string {
  return `AFF-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`
}

const AffiliateProductForm = () => {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<AffiliateProductFormData>(() => ({
    ...emptyForm,
    sku: generateAffiliateSku(),
  }))
  const [previewUrl, setPreviewUrl] = useState('')
  const [preview, setPreview] = useState<LinkPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const lastRequestedUrl = useRef('')
  const [createdAt, setCreatedAt] = useState<number | undefined>()
  const [productFlags, setProductFlags] = useState({ featured: false, active: true })
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isFetching, setIsFetching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const categoryData = await getAllCategories()
        setCategories(categoryData)

        if (id) {
          const product = await getProductById(id)
          if (!product || product.type !== 'affiliate') {
            setLoadError('Affiliate product not found.')
            return
          }
          setCreatedAt(product.createdAt)
          setProductFlags({ featured: product.featured, active: product.active })
          setPreviewUrl(product.affiliateUrl ?? '')
          lastRequestedUrl.current = product.affiliateUrl ?? ''
          setForm({
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            categoryId: product.categoryId,
            shortDescription: product.shortDescription,
            fullDescription: product.fullDescription,
            images: product.images,
            price: product.price === undefined ? '' : String(product.price),
            priceCurrency: product.priceCurrency ?? '',
            keywords: product.keywords?.join(', ') ?? '',
            tags: product.tags?.join(', ') ?? '',
            affiliateUrl: product.affiliateUrl ?? '',
          })
        } else if (categoryData.length > 0) {
          const defaultCategory = categoryData.find((category) => category.active)
          if (defaultCategory) {
            setForm((current) => ({ ...current, categoryId: defaultCategory.id }))
          }
        }
      } catch (error) {
        setLoadError('There was a problem loading the data.')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadInitialData()
  }, [id])

  function handleNameChange(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: slugManuallyEdited ? current.slug : slugify(name),
    }))
  }

  const handleFetchPreview = useCallback(async () => {
    if (!previewUrl) {
      setPreviewError('Paste a product URL first.')
      return
    }
    lastRequestedUrl.current = previewUrl
    setIsFetching(true)
    setPreviewError(null)
    setForm((current) => ({ ...current, affiliateUrl: previewUrl }))

    try {
      const result = await fetchAffiliatePreview(previewUrl)
      setPreview(result)
      setForm((current) => ({
        ...current,
        name: result.title || current.name,
        slug: !slugManuallyEdited && result.title ? slugify(result.title) : current.slug,
        sku: current.sku || generateAffiliateSku(),
        shortDescription: result.description
          ? result.description.slice(0, 180)
          : current.shortDescription,
        fullDescription: result.description || current.fullDescription,
        price: result.price === undefined ? '' : String(result.price),
        priceCurrency: result.currency ?? (result.price === undefined ? '' : current.priceCurrency),
        affiliateUrl: previewUrl,
      }))

      if (result.imageUrl) {
        setIsUploading(true)
        try {
          const uploadedImage = await uploadRemoteImageToCloudinary(result.imageUrl)
          setForm((current) => ({
            ...current,
            images: [uploadedImage.secureUrl, ...current.images.filter(
              (image) => image !== uploadedImage.secureUrl
            )].slice(0, 4),
          }))
        } catch (error) {
          setPreviewError(
            `Preview details loaded, but the image could not be saved to Cloudinary. ${errorMessage(error)}`
          )
        } finally {
          setIsUploading(false)
        }
      } else {
        setPreviewError('Preview details loaded, but the page did not provide a product image.')
      }
    } catch (error) {
      setPreviewError(`Could not fetch product details. Check the link or edit the details manually. ${errorMessage(error)}`)
      setPreview(null)
    } finally {
      setIsFetching(false)
    }
  }, [previewUrl, slugManuallyEdited])

  useEffect(() => {
    if (!/^https?:\/\//i.test(previewUrl) || previewUrl === lastRequestedUrl.current) return
    const timer = window.setTimeout(() => {
      void handleFetchPreview()
    }, 700)
    return () => window.clearTimeout(timer)
  }, [previewUrl, handleFetchPreview])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = affiliateProductSchema.safeParse(form)
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Check the product details.')
      return
    }

    setIsSaving(true)
    try {
      const now = Date.now()
      const data = {
        type: 'affiliate' as const,
        name: result.data.name,
        slug: result.data.slug,
        sku: result.data.sku,
        shortDescription: result.data.shortDescription,
        fullDescription: result.data.fullDescription,
        ...(result.data.price !== '' ? { price: Number(result.data.price) } : {}),
        ...(result.data.priceCurrency ? { priceCurrency: result.data.priceCurrency } : {}),
        categoryId: result.data.categoryId || categories.find((category) => category.active)?.id || '',
        images: result.data.images,
        affiliateUrl: result.data.affiliateUrl,
        keywords: splitValues(result.data.keywords),
        tags: splitValues(result.data.tags),
        featured: productFlags.featured,
        active: productFlags.active,
        createdAt: createdAt ?? now,
        updatedAt: now,
      }

      if (id) {
        await updateProduct(id, data)
        toast.success('Affiliate product updated successfully.')
      } else {
        await createAffiliateProduct(data)
        toast.success('Affiliate product created successfully.')
      }
      navigate('/admin/products')
    } catch (error) {
      toast.error('There was a problem saving the affiliate product.')
      console.error(error)
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

  if (loadError) return <p className="py-16 text-center text-red-600">{loadError}</p>

  return (
    <>
      <Helmet>
        <title>{isEditMode ? 'Edit affiliate product' : 'New affiliate product'} — Admin — Shoplexᴮᴰ</title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        {isEditMode ? 'Edit affiliate product' : 'New affiliate product'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              label="Product link"
              value={previewUrl}
              onChange={(event) => {
                const url = event.target.value
                setPreviewUrl(url)
                setPreview(null)
                setPreviewError(null)
                lastRequestedUrl.current = ''
                setForm((current) => ({
                  ...current,
                  affiliateUrl: url,
                  name: '',
                  slug: '',
                  shortDescription: '',
                  fullDescription: '',
                  images: [],
                  price: '',
                  priceCurrency: '',
                }))
              }}
              disabled={isFetching || isSaving}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="self-end"
              onClick={() => {
                lastRequestedUrl.current = ''
                void handleFetchPreview()
              }}
              isLoading={isFetching || isUploading}
              disabled={isFetching || isUploading || isSaving}
            >
              Fetch
            </Button>
            <Button type="submit" className="self-end" isLoading={isSaving} disabled={isUploading || isFetching}>
              Save
            </Button>
          </div>
          {isFetching && (
            <p className="text-sm text-[color:var(--color-text-secondary)]">Fetching product details…</p>
          )}
          {(preview || form.images.length > 0) && (
            <div className="flex items-center gap-3">
              {form.images[0] && (
                <img
                  src={form.images[0]}
                  alt=""
                  className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{form.name}</p>
                {preview && (
                  <p className="text-sm text-[color:var(--color-text-secondary)]">
                    {preview.siteName} · {preview.finalUrl}
                  </p>
                )}
              </div>
            </div>
          )}
          {previewError && <p role="alert" className="text-sm text-red-600">{previewError}</p>}
        </Card>

        {preview && preview.price === undefined && !form.price && (
          <Card>
            <Input
              label="Price"
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              disabled={isSaving}
            />
          </Card>
        )}

        <details
          open={isDetailsOpen}
          onToggle={(event) => setIsDetailsOpen(event.currentTarget.open)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <summary className="cursor-pointer font-medium text-[color:var(--color-deep-green)]">
            Edit details
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              disabled={isSaving}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Slug"
                required
                value={form.slug}
                onChange={(event) => {
                  setSlugManuallyEdited(true)
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }}
                disabled={isSaving}
              />
              <Input label="SKU" value={form.sku} readOnly />
            </div>
            <label className="block text-sm font-medium text-[color:var(--color-text-primary)]">
              Category (optional)
              <select
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                disabled={isSaving}
                className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]"
              >
                <option value="">Use default category</option>
                {categories.filter((category) => category.active).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <Input
              label="Price"
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              disabled={isSaving}
            />
            <Input
              label="Currency"
              value={form.priceCurrency}
              onChange={(event) => setForm((current) => ({ ...current, priceCurrency: event.target.value }))}
              hint="For example USD or BDT"
              disabled={isSaving}
            />
            <div>
              <Input
                label="Image URL"
                type="url"
                value={form.images[0] ?? ''}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  images: event.target.value
                    ? [event.target.value, ...current.images.slice(1)]
                    : current.images.slice(1),
                }))}
                disabled={isSaving}
              />
              {form.images[0] && (
                <img
                  src={form.images[0]}
                  alt="Product image preview"
                  className="mt-2 h-16 w-16 rounded-lg border border-gray-200 object-cover"
                />
              )}
            </div>
            <Input
              label="Short description"
              value={form.shortDescription}
              onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))}
              disabled={isSaving}
            />
            <label className="block text-sm font-medium text-[color:var(--color-text-primary)]">
              Description
              <textarea
                rows={5}
                value={form.fullDescription}
                onChange={(event) => setForm((current) => ({ ...current, fullDescription: event.target.value }))}
                disabled={isSaving}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Keywords"
                value={form.keywords}
                onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))}
                hint="Comma-separated"
                disabled={isSaving}
              />
              <Input
                label="Tags"
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                hint="Comma-separated"
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-[color:var(--color-text-secondary)]">
              Affiliate URL is saved exactly as entered, including its tracking parameters.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={productFlags.featured}
                  onChange={(event) => setProductFlags((current) => ({ ...current, featured: event.target.checked }))}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={productFlags.active}
                  onChange={(event) => setProductFlags((current) => ({ ...current, active: event.target.checked }))}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Active
              </label>
            </div>
          </div>
        </details>
      </form>
    </>
  )
}

export default AffiliateProductForm
