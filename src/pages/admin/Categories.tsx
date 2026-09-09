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
import Spinner from '../../components/common/Spinner'

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
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  imageUrl: '',
  order: 0,
  active: true,
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
      setError('ক্যাটাগরি লোড করতে সমস্যা হয়েছে।')
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
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে।')
      console.error(err)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('নাম এবং স্লাগ দুটোই আবশ্যক।')
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
      }

      if (editingId) {
        await updateCategory(editingId, payload)
        toast.success('ক্যাটাগরি আপডেট হয়েছে।')
      } else {
        await createCategory(payload)
        toast.success('নতুন ক্যাটাগরি তৈরি হয়েছে।')
      }

      closeForm()
      await loadCategories()
    } catch (err) {
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`"${category.name}" ক্যাটাগরিটি ডিলিট করতে চান?`)) return

    setDeletingId(category.id)
    try {
      await deleteCategory(category.id)
      toast.success('ক্যাটাগরি ডিলিট হয়েছে।')
      await loadCategories()
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
        <title>ক্যাটাগরি ম্যানেজমেন্ট — Admin — Sirat Organic Mart</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          ক্যাটাগরি ম্যানেজমেন্ট
        </h1>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateForm}>
          নতুন ক্যাটাগরি
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">
              {editingId ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি যোগ করুন'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-[color:var(--color-text-secondary)] hover:text-black"
              aria-label="বন্ধ করুন"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              hint="URL-এ ব্যবহার হবে, যেমন: /category/এই-স্লাগ"
              disabled={isSaving}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                ছবি
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
                {isUploading && <Spinner size="sm" />}
              </div>
            </div>

            <Input
              label="অর্ডার (সাজানোর ক্রম)"
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
              অ্যাক্টিভ (স্টোরফ্রন্টে দেখাবে)
            </label>

            <div className="flex gap-3">
              <Button type="submit" isLoading={isSaving} disabled={isUploading}>
                সংরক্ষণ করুন
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm} disabled={isSaving}>
                বাতিল
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : categories.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          এখনো কোনো ক্যাটাগরি যোগ করা হয়নি।
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
                      /{category.slug} · ক্রম: {category.order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={category.active ? 'success' : 'neutral'}>
                    {category.active ? 'অ্যাক্টিভ' : 'ইনঅ্যাক্টিভ'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => openEditForm(category)}
                    className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-gray-100"
                    aria-label="এডিট করুন"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category.id}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    aria-label="ডিলিট করুন"
                  >
                    {deletingId === category.id ? (
                      <Spinner size="sm" />
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