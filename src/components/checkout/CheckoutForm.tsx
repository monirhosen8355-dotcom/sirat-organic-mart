import { useState, type FormEvent } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import { checkoutSchema, type CheckoutFormData } from '../../lib/validation/checkoutSchema'
import { DELIVERY_CHARGES, DELIVERY_ZONE_LABELS, type DeliveryZone } from '../../lib/delivery/deliveryZones'

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => void
  isSubmitting: boolean
  deliveryZone: DeliveryZone | null
  onDeliveryZoneChange: (zone: DeliveryZone) => void
}

type FormErrors = Partial<Record<keyof CheckoutFormData, string>>

const CheckoutForm = ({
  onSubmit,
  isSubmitting,
  deliveryZone,
  onDeliveryZoneChange,
}: CheckoutFormProps) => {
  const [values, setValues] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryNote: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const handleChange = (field: keyof typeof values) => (e: FormEvent<HTMLInputElement>) => {
    // e.currentTarget শুধু event dispatch-এর সময় synchronously valid থাকে।
    // setValues-এর functional updater-এর ভেতরে e.currentTarget অ্যাক্সেস করলে
    // React batching-এর কারণে মাঝে মাঝে সেটা null হয়ে যায় (event ততক্ষণে
    // dispatch শেষ করে ফেলেছে) — তাই আগেই value বের করে নেওয়া হলো।
    const value = e.currentTarget.value
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const result = checkoutSchema.safeParse({ ...values, deliveryZone })

    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CheckoutFormData
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="আপনার নাম"
        placeholder="যেমন: রহিম উদ্দিন"
        required
        value={values.customerName}
        onChange={handleChange('customerName')}
        error={errors.customerName}
        disabled={isSubmitting}
      />

      <Input
        label="মোবাইল নম্বর"
        type="tel"
        inputMode="numeric"
        placeholder="017XXXXXXXX"
        required
        value={values.customerPhone}
        onChange={handleChange('customerPhone')}
        error={errors.customerPhone}
        disabled={isSubmitting}
      />

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
          ডেলিভারি এলাকা
          <span className="ml-0.5 text-red-600">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(DELIVERY_ZONE_LABELS) as DeliveryZone[]).map((zone) => (
            <label
              key={zone}
              className={[
                'flex cursor-pointer items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm transition-colors',
                deliveryZone === zone
                  ? 'border-[color:var(--color-emerald)] bg-[color:var(--color-emerald)]/5'
                  : 'border-gray-300 hover:border-gray-400',
                isSubmitting ? 'cursor-not-allowed opacity-70' : '',
              ].join(' ')}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryZone"
                  value={zone}
                  checked={deliveryZone === zone}
                  onChange={() => onDeliveryZoneChange(zone)}
                  disabled={isSubmitting}
                  className="h-4 w-4 accent-[color:var(--color-emerald)]"
                />
                {DELIVERY_ZONE_LABELS[zone]}
              </span>
              <span className="font-medium text-[color:var(--color-text-secondary)]">
                ৳{DELIVERY_CHARGES[zone]}
              </span>
            </label>
          ))}
        </div>
        {errors.deliveryZone && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {errors.deliveryZone}
          </p>
        )}
      </div>

      <div className="w-full">
        <label
          htmlFor="deliveryAddress"
          className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]"
        >
          সম্পূর্ণ ঠিকানা
          <span className="ml-0.5 text-red-600">*</span>
        </label>
        <textarea
          id="deliveryAddress"
          required
          rows={3}
          placeholder="বাসা/ফ্ল্যাট নং, রোড, এলাকা, থানা, জেলা"
          value={values.deliveryAddress}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, deliveryAddress: e.target.value }))
          }
          disabled={isSubmitting}
          aria-invalid={!!errors.deliveryAddress}
          className={[
            'w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            errors.deliveryAddress
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-[color:var(--color-emerald)] focus:ring-[color:var(--color-emerald)]',
            'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70',
          ].join(' ')}
        />
        {errors.deliveryAddress && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {errors.deliveryAddress}
          </p>
        )}
      </div>

      <Input
        label="অর্ডার নোট (ঐচ্ছিক)"
        placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন"
        value={values.deliveryNote}
        onChange={handleChange('deliveryNote')}
        error={errors.deliveryNote}
        disabled={isSubmitting}
      />

      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)
      </Button>
    </form>
  )
}

export default CheckoutForm