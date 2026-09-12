import { describe, it, expect } from 'vitest'
import { checkoutSchema } from './checkoutSchema'

const validData = {
  customerName: 'রহিম উদ্দিন',
  customerPhone: '01712345678',
  deliveryAddress: 'বাসা ১২, রোড ৫, ধানমন্ডি, ঢাকা',
  deliveryNote: '',
}

describe('checkoutSchema', () => {
  it('সঠিক ডেটা গ্রহণ করে', () => {
    const result = checkoutSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('খুব ছোট নাম প্রত্যাখ্যান করে', () => {
    const result = checkoutSchema.safeParse({ ...validData, customerName: 'র' })
    expect(result.success).toBe(false)
  })

  it('ভুল ফরম্যাটের ফোন নম্বর প্রত্যাখ্যান করে', () => {
    const invalidPhones = ['123', '02712345678', '017123456', '0171234567890']
    for (const phone of invalidPhones) {
      const result = checkoutSchema.safeParse({ ...validData, customerPhone: phone })
      expect(result.success).toBe(false)
    }
  })

  it('সঠিক ফরম্যাটের ফোন নম্বর গ্রহণ করে', () => {
    const validPhones = ['01712345678', '01312345678', '01912345678']
    for (const phone of validPhones) {
      const result = checkoutSchema.safeParse({ ...validData, customerPhone: phone })
      expect(result.success).toBe(true)
    }
  })

  it('খুব ছোট ঠিকানা প্রত্যাখ্যান করে', () => {
    const result = checkoutSchema.safeParse({ ...validData, deliveryAddress: 'ছোট' })
    expect(result.success).toBe(false)
  })

  it('deliveryNote ছাড়াও বৈধ থাকে (অপশনাল)', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
const { deliveryNote, ...withoutNote } = validData
    const result = checkoutSchema.safeParse(withoutNote)
    expect(result.success).toBe(true)
  })
})