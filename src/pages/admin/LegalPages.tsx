import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Pencil, X } from 'lucide-react'
import { getAllLegalPages, saveLegalPage } from '../../services/legal/legalService'
import type { LegalPage, LegalPageSlug } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { ListSkeleton } from '../../components/common/Skeleton'

// এই ৬টা পেজ প্রজেক্টে স্থায়ীভাবে নির্দিষ্ট — routes/Footer-এ আগে থেকেই লিংক করা আছে,
// তাই অ্যাডমিন নতুন slug যোগ/বাদ দিতে পারবে না, শুধু টাইটেল/কন্টেন্ট এডিট করতে পারবে।
const LEGAL_PAGE_SLOTS: { slug: LegalPageSlug; defaultTitle: string }[] = [
  { slug: 'about', defaultTitle: 'আমাদের সম্পর্কে' },
  { slug: 'privacy-policy', defaultTitle: 'প্রাইভেসি পলিসি' },
  { slug: 'terms', defaultTitle: 'শর্তাবলী' },
  { slug: 'returns-refunds', defaultTitle: 'রিটার্ন ও রিফান্ড' },
  { slug: 'delivery-information', defaultTitle: 'ডেলিভারি তথ্য' },
  { slug: 'contact', defaultTitle: 'যোগাযোগ' },
]

interface LegalFormState {
  title: string
  content: string
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return 'এখনো সেভ হয়নি'
  return new Date(timestamp).toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const LegalPages = () => {
  const [pagesBySlug, setPagesBySlug] = useState<Partial<Record<LegalPageSlug, LegalPage>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingSlug, setEditingSlug] = useState<LegalPageSlug | null>(null)
  const [form, setForm] = useState<LegalFormState>({ title: '', content: '' })
  const [isSaving, setIsSaving] = useState(false)

  async function loadPages() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllLegalPages()
      const map: Partial<Record<LegalPageSlug, LegalPage>> = {}
      data.forEach((page) => {
        map[page.slug] = page
      })
      setPagesBySlug(map)
    } catch (err) {
      setError('লিগ্যাল পেজ লোড করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
  }, [])

  function openEditForm(slug: LegalPageSlug, defaultTitle: string) {
    const existing = pagesBySlug[slug]
    setEditingSlug(slug)
    setForm({
      title: existing?.title ?? defaultTitle,
      content: existing?.content ?? '',
    })
  }

  function closeForm() {
    setEditingSlug(null)
    setForm({ title: '', content: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingSlug) return

    if (!form.title.trim()) {
      toast.error('টাইটেল আবশ্যক।')
      return
    }

    setIsSaving(true)
    try {
      await saveLegalPage(editingSlug, {
        title: form.title.trim(),
        content: form.content,
      })
      toast.success('পেজ সংরক্ষণ করা হয়েছে।')
      closeForm()
      await loadPages()
    } catch (err) {
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>লিগ্যাল পেজ — Admin — Shoplexᴮᴰ</title>
      </Helmet>

      <h1 className="mb-6 text-xl font-semibold text-[color:var(--color-deep-green)]">
        লিগ্যাল পেজ ম্যানেজমেন্ট
      </h1>

      {editingSlug && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">পেজ এডিট করুন</h2>
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
              label="টাইটেল"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              disabled={isSaving}
            />

            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                কন্টেন্ট
              </label>
              <textarea
                rows={12}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                disabled={isSaving}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)] disabled:cursor-not-allowed disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                আপাতত সাধারণ টেক্সট — রিচ-টেক্সট এডিটর (react-quill/jodit-react) পরে যোগ করা
                যাবে।
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" isLoading={isSaving}>
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
      ) : (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-gray-100">
            {LEGAL_PAGE_SLOTS.map(({ slug, defaultTitle }) => {
              const existing = pagesBySlug[slug]
              return (
                <div key={slug} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{existing?.title ?? defaultTitle}</p>
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      /{slug} · সর্বশেষ আপডেট: {formatDate(existing?.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditForm(slug, defaultTitle)}
                    className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-gray-100"
                    aria-label="এডিট করুন"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </>
  )
}

export default LegalPages