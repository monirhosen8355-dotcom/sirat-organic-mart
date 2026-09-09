import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  getAllCouponsAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../../services/coupons/couponService'
import type { Coupon } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'

interface CouponFormState {
  code: string
  discountType: Coupon['discountType']
  discountValue: number
  minOrderAmount: string
  expiresAt: string
  active: boolean
}

const emptyForm: CouponFormState = {
  code: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderAmount: '',
  expiresAt: '',
  active: true,
}

// <input type="date"> থেকে পাওয়া "YYYY-MM-DD" স্ট্রিং-কে সেই তারিখের
// স্থানীয় সময়ে দিনের শেষ মুহূর্তে (23:59:59.999) রূপান্তর করে, যাতে
// অ্যাডমিনের সিলেক্ট করা তারিখ পুরোটা জুড়েই কুপন valid থাকে —
// new Date(dateString) দিনের শুরুতে (00:00 UTC) সেট করে দিত, যা ভুল ছিল।
function endOfDay(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '—'
  return new Date(timestamp).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadCoupons() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllCouponsAdmin()
      setCoupons(data)
    } catch (err) {
      setError('কুপন লোড করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  function openEditForm(coupon: Coupon) {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount:
        coupon.minOrderAmount !== undefined ? String(coupon.minOrderAmount) : '',
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
        : '',
      active: coupon.active,
    })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.code.trim()) {
      toast.error('কুপন কোড আবশ্যক।')
      return
    }

    if (form.discountValue <= 0) {
      toast.error('ছাড়ের পরিমাণ শূন্যের বেশি হতে হবে।')
      return
    }

    if (form.discountType === 'percentage' && form.discountValue > 100) {
      toast.error('পার্সেন্টেজ ছাড় ১০০-এর বেশি হতে পারবে না।')
      return
    }

    setIsSaving(true)
    try {
      const payload: Omit<Coupon, 'id'> = {
        code: form.code.trim(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        expiresAt: form.expiresAt ? endOfDay(form.expiresAt) : undefined,
        active: form.active,
      }

      if (editingId) {
        await updateCoupon(editingId, payload)
        toast.success('কুপন আপডেট হয়েছে।')
      } else {
        await createCoupon(payload)
        toast.success('নতুন কুপন তৈরি হয়েছে।')
      }

      closeForm()
      await loadCoupons()
    } catch (err) {
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে।')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!window.confirm(`"${coupon.code}" কুপনটি ডিলিট করতে চান?`)) return

    setDeletingId(coupon.id)
    try {
      await deleteCoupon(coupon.id)
      toast.success('কুপন ডিলিট হয়েছে।')
      await loadCoupons()
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
        <title>কুপন ম্যানেজমেন্ট — Admin — Sirat Organic Mart</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          কুপন ম্যানেজমেন্ট
        </h1>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateForm}>
          নতুন কুপন
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">
              {editingId ? 'কুপন এডিট করুন' : 'নতুন কুপন যোগ করুন'}
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
              label="কুপন কোড"
              required
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
              hint="স্বয়ংক্রিয়ভাবে ব্যবহারের সময় বড় হাতের অক্ষরে রূপান্তরিত হয়"
              disabled={isSaving}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                ছাড়ের ধরন
              </label>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discountType"
                    checked={form.discountType === 'percentage'}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, discountType: 'percentage' }))
                    }
                    disabled={isSaving}
                  />
                  পার্সেন্টেজ (%)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discountType"
                    checked={form.discountType === 'fixed'}
                    onChange={() => setForm((prev) => ({ ...prev, discountType: 'fixed' }))}
                    disabled={isSaving}
                  />
                  নির্দিষ্ট টাকা (৳)
                </label>
              </div>
            </div>

            <Input
              label={form.discountType === 'percentage' ? 'ছাড় (%)' : 'ছাড় (৳)'}
              type="number"
              min={0}
              max={form.discountType === 'percentage' ? 100 : undefined}
              required
              value={form.discountValue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))
              }
              disabled={isSaving}
            />

            <Input
              label="সর্বনিম্ন অর্ডার পরিমাণ (৳) — ঐচ্ছিক"
              type="number"
              min={0}
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, minOrderAmount: e.target.value }))
              }
              hint="খালি রাখলে কোনো ন্যূনতম সীমা থাকবে না"
              disabled={isSaving}
            />

            <Input
              label="মেয়াদ শেষের তারিখ — ঐচ্ছিক"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              hint="খালি রাখলে কুপনের কোনো মেয়াদ থাকবে না"
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
              অ্যাক্টিভ (চেকআউটে ব্যবহারযোগ্য)
            </label>

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
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : coupons.length === 0 ? (
        <p className="py-16 text-center text-[color:var(--color-text-secondary)]">
          এখনো কোনো কুপন যোগ করা হয়নি।
        </p>
      ) : (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-gray-100">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{coupon.code}</p>
                  <p className="text-xs text-[color:var(--color-text-secondary)]">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}% ছাড়`
                      : `৳${coupon.discountValue} ছাড়`}
                    {coupon.minOrderAmount ? ` · সর্বনিম্ন ৳${coupon.minOrderAmount}` : ''}
                    {' · মেয়াদ: '}
                    {formatDate(coupon.expiresAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={coupon.active ? 'success' : 'neutral'}>
                    {coupon.active ? 'অ্যাক্টিভ' : 'ইনঅ্যাক্টিভ'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => openEditForm(coupon)}
                    className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-gray-100"
                    aria-label="এডিট করুন"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(coupon)}
                    disabled={deletingId === coupon.id}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    aria-label="ডিলিট করুন"
                  >
                    {deletingId === coupon.id ? (
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

export default Coupons