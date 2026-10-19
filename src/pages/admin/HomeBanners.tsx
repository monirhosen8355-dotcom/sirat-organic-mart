import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../../services/banners/bannerService'
import { uploadImageToCloudinary } from '../../lib/cloudinary/upload'
import type { HomeBanner } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import { ListSkeleton } from '../../components/common/Skeleton'

interface BannerFormState {
  imageUrl: string
  linkUrl: string
  altText: string
  title: string
  subtitle: string
  ctaText: string
  placement: 'hero' | 'middle' | 'triple'
  order: number
  active: boolean
}

const emptyForm: BannerFormState = {
  imageUrl: '',
  linkUrl: '',
  altText: '',
  title: '',
  subtitle: '',
  ctaText: '',
  placement: 'hero',
  order: 0,
  active: true,
}

const HomeBanners = () => {
  const [banners, setBanners] = useState<HomeBanner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadBanners() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllBanners()
      setBanners(data)
    } catch (err) {
      setError('ব্যানার লোড করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...emptyForm, order: banners.length })
    setIsFormOpen(true)
  }

  function openEditForm(banner: HomeBanner) {
    setEditingId(banner.id)
    setForm({
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? '',
      altText: banner.altText,
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      ctaText: banner.ctaText ?? '',
      placement: banner.placement ?? 'hero',
      order: banner.order,
      active: banner.active,
    })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
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

    if (!form.imageUrl) {
      toast.error('A banner image is required.')
      return
    }
    if (!form.altText.trim()) {
      toast.error('Banner alt text is required.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl.trim() || undefined,
        altText: form.altText.trim(),
        title: form.title.trim() || undefined,
        subtitle: form.subtitle.trim() || undefined,
        ctaText: form.ctaText.trim() || undefined,
        placement: form.placement,
        order: form.order,
        active: form.active,
      }

      if (editingId) {
        await updateBanner(editingId, payload)
        toast.success('Banner updated successfully.')
      } else {
        await createBanner(payload)
        toast.success('New banner created successfully.')
      }

      closeForm()
      await loadBanners()
    } catch (err) {
      toast.error('There was a problem saving the banner.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(banner: HomeBanner) {
    if (!window.confirm('Are you sure you want to delete this banner?')) return

    setDeletingId(banner.id)
    try {
      await deleteBanner(banner.id)
      toast.success('Banner deleted successfully.')
      await loadBanners()
    } catch (err) {
      toast.error('There was a problem deleting the banner.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Helmet>
        <title>Homepage banners — Admin — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          Homepage banners
        </h1>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateForm}>
          New banner
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">
              {editingId ? 'ব্যানার এডিট করুন' : 'নতুন ব্যানার যোগ করুন'}
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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                ব্যানার ছবি <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-3">
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="h-16 w-28 rounded-lg border border-gray-200 object-cover"
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
              <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                প্রস্তাবিত সাইজ: প্রায় 1200×500px, landscape ছবি সবচেয়ে ভালো দেখাবে
              </p>
            </div>

            <Input
              label="বিবরণ (Alt text)"
              required
              value={form.altText}
              onChange={(e) => setForm((prev) => ({ ...prev, altText: e.target.value }))}
              hint="স্ক্রিন-রিডার এবং SEO-এর জন্য ব্যবহৃত হয়"
              disabled={isSaving}
            />

            <Input
              label="লিংক (ঐচ্ছিক)"
              value={form.linkUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
              hint="যেমন: /shop অথবা /category/kono-slug — খালি রাখলে ব্যানার ক্লিক করা যাবে না"
              disabled={isSaving}
            />

            <Input
              label="শিরোনাম (ঐচ্ছিক)"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              hint="ব্যানারের প্রধান শিরোনাম, ওভারলে দেখানো হবে"
              disabled={isSaving}
            />

            <Input
              label="উপশিরোনাম (ঐচ্ছিক)"
              value={form.subtitle}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
              hint="ছোট বর্ণনা, ওভারলে দেখানো হবে"
              disabled={isSaving}
            />

            <Input
              label="ক্লিকের টেক্সট (ঐচ্ছিক)"
              value={form.ctaText}
              onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
              hint="যেমন: এখনই দেখুন, কেনাকাটা করুন"
              disabled={isSaving}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                ব্যানারের অবস্থান
              </label>
              <select
                value={form.placement}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    placement: e.target.value as 'hero' | 'middle' | 'triple',
                  }))
                }
                disabled={isSaving}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-emerald)]"
              >
                <option value="hero">হিরো সেকশন</option>
                <option value="middle">মাঝের সেকশন (৪-ছবির গ্রিড)</option>
                <option value="triple">প্রোমো স্ট্রিপ (৩-ছবি পাশাপাশি)</option>
              </select>
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
              অ্যাক্টিভ (হোমপেজে দেখাবে)
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
        <ListSkeleton rows={4} />
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : banners.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          এখনো কোনো ব্যানার যোগ করা হয়নি। যোগ না করা পর্যন্ত হোমপেজে একটা ডিফল্ট ডেমো ব্যানার দেখাবে।
        </p>
      ) : (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-gray-100">
            {banners.map((banner) => (
              <div key={banner.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={banner.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-12 w-20 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">{banner.altText}</p>
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      {banner.linkUrl ? `লিংক: ${banner.linkUrl}` : 'কোনো লিংক নেই'} · ক্রম:{' '}
                      {banner.order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={banner.active ? 'success' : 'neutral'}>
                    {banner.active ? 'অ্যাক্টিভ' : 'ইনঅ্যাক্টিভ'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => openEditForm(banner)}
                    className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-gray-100"
                    aria-label="এডিট করুন"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner)}
                    disabled={deletingId === banner.id}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    aria-label="ডিলিট করুন"
                  >
                    {deletingId === banner.id ? (
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

export default HomeBanners