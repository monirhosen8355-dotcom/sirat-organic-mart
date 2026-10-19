import { useEffect, useState, type FormEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { MapPin, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import {
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
} from '../../services/users/userService'
import type { Address } from '../../types'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { AddressListSkeleton } from '../../components/common/Skeleton'

const Addresses = () => {
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [label, setLabel] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [phone, setPhone] = useState('')

  const loadAddresses = async (uid: string) => {
    setIsLoading(true)
    try {
      const result = await getUserAddresses(uid)
      setAddresses(result)
    } catch (err) {
      console.error(err)
      toast.error('ঠিকানা লোড করতে সমস্যা হয়েছে')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadAddresses(user.uid)
  }, [user])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!label.trim() || !fullAddress.trim() || !phone.trim()) {
      toast.error('সব ঘর পূরণ করুন')
      return
    }

    setIsSubmitting(true)
    try {
      await addUserAddress(user.uid, {
        label: label.trim(),
        fullAddress: fullAddress.trim(),
        phone: phone.trim(),
        isDefault: addresses.length === 0,
      })
      setLabel('')
      setFullAddress('')
      setPhone('')
      setShowForm(false)
      await loadAddresses(user.uid)
      toast.success('ঠিকানা যোগ হয়েছে')
    } catch (err) {
      console.error(err)
      toast.error('ঠিকানা যোগ করা যায়নি')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!user) return
    try {
      await deleteUserAddress(user.uid, addressId)
      await loadAddresses(user.uid)
      toast.success('ঠিকানা মুছে ফেলা হয়েছে')
    } catch (err) {
      console.error(err)
      toast.error('ঠিকানা মুছতে সমস্যা হয়েছে')
    }
  }

  return (
    <>
      <Helmet>
        <title>ঠিকানা — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
            সংরক্ষিত ঠিকানা
          </h1>
          {!showForm && (
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowForm(true)}
            >
              নতুন ঠিকানা
            </Button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 p-4"
          >
            <Input
              label="লেবেল"
              placeholder="যেমন: বাসা, অফিস"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="সম্পূর্ণ ঠিকানা"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="মোবাইল নম্বর"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <Button type="submit" isLoading={isSubmitting}>
                সংরক্ষণ করুন
              </Button>
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                বাতিল
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <AddressListSkeleton count={3} />
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MapPin className="h-12 w-12 text-[color:var(--color-text-secondary)] opacity-40" />
            <p className="text-[color:var(--color-text-secondary)]">
              কোনো সংরক্ষিত ঠিকানা নেই।
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((addr) => (
              <Card key={addr.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{addr.label}</p>
                  <p className="text-sm text-[color:var(--color-text-secondary)]">
                    {addr.fullAddress}
                  </p>
                  <p className="text-sm text-[color:var(--color-text-secondary)]">
                    {addr.phone}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(addr.id)}
                  aria-label="ঠিকানা মুছুন"
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Addresses