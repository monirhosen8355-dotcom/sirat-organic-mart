import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categories/categoryService'
import { uploadImageToCloudinary } from '../../lib/cloudinary/upload'
import type { Category } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import { ListSkeleton } from '../../components/common/Skeleton'

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

interface CategoryFormState {
  name: string
  slug: string
  imageUrl: string
  order: number
  active: boolean
  showOnHomepage: boolean
  homeOrder: number
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  imageUrl: '',
  order: 0,
  active: true,
  showOnHomepage: false,
  homeOrder: 0,
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadCategories() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (err) {
      setError('There was a problem loading categories.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...emptyForm, order: categories.length })
    setIsFormOpen(true)
  }

  function openEditForm(category: Category) {
    setEditingId(category.id)
    setForm({
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl ?? '',
      order: category.order,
      active: category.active,
      showOnHomepage: category.showOnHomepage ?? false,
      homeOrder: category.homeOrder ?? 0,
    })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }))
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const result = await uploadImageToCloudinary(file)
      setForm((prev) => ({ ...prev, imageUrl: result.secureUrl }))
    } catch (err) {
      toast.error('Image upload failed.')
      console.error(err)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Both the name and slug are required.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        imageUrl: form.imageUrl || undefined,
        order: form.order,
        active: form.active,
        showOnHomepage: form.showOnHomepage,
        homeOrder: form.homeOrder,
      }

      if (editingId) {
        await updateCategory(editingId, payload)
        toast.success('Category updated successfully.')
      } else {
        await createCategory(payload)
        toast.success('New category created successfully.')
      }

      closeForm()
      await loadCategories()
    } catch (err) {
      toast.error('There was a problem saving the category.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Are you sure you want to delete the "${category.name}" category?`)) return

    setDeletingId(category.id)
    try {
      await deleteCategory(category.id)
      toast.success('Category deleted successfully.')
      await loadCategories()
    } catch (err) {
      toast.error('There was a problem deleting the category.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Helmet>
        <title>Category management — Admin — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          Category management
        </h1>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateForm}>
          New category
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">
              {editingId ? 'Edit category' : 'Add a new category'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-[color:var(--color-text-secondary)] hover:text-black"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              hint="Used in the URL, for example: /category/this-slug"
              disabled={isSaving}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                Image
              </label>
              <div className="flex items-center gap-3">
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isSaving || isUploading}
                  className="text-sm"
                />
                {isUploading && <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-[color:var(--color-emerald)]/70" />}
              </div>
            </div>

            <Input
              label="Order (display sequence)"
              type="number"
              value={form.order}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, order: Number(e.target.value) }))
              }
              disabled={isSaving}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                disabled={isSaving}
                className="h-4 w-4 rounded border-gray-300"
              />
              Active (visible on storefront)
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.showOnHomepage}
                onChange={(e) => setForm((prev) => ({ ...prev, showOnHomepage: e.target.checked }))}
                disabled={isSaving}
                className="h-4 w-4 rounded border-gray-300"
              />
              Show on homepage
            </label>

            <Input
              label="Homepage display order"
              type="number"
              value={form.homeOrder}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, homeOrder: Number(e.target.value) }))
              }
              disabled={isSaving}
            />

            <div className="flex gap-3">
              <Button type="submit" isLoading={isSaving} disabled={isUploading}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : categories.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          No categories have been added yet.
        </p>
      ) : (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-gray-100">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100" />
                  )}
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      /{category.slug} · Order: {category.order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={category.active ? 'success' : 'neutral'}>
                    {category.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => openEditForm(category)}
                    className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-gray-100"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category.id}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    aria-label="Delete"
                  >
                    {deletingId === category.id ? (
                      <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-red-500/70" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

export default Categories