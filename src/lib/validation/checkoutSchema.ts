import { z } from 'zod'

/**
 * বাংলাদেশি মোবাইল নম্বর ফরম্যাট: 01 দিয়ে শুরু, মোট ১১ ডিজিট
 * (যেমন 017XXXXXXXX, 013XXXXXXXX ইত্যাদি — 011-019 অপারেটর কোড)
 */
const bdPhoneRegex = /^01[3-9]\d{8}$/

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে')
    .max(100, 'নাম অনেক বড়'),
  customerPhone: z
    .string()
    .trim()
    .regex(bdPhoneRegex, 'সঠিক ১১ ডিজিটের বাংলাদেশি ফোন নম্বর দিন (যেমন: 017XXXXXXXX)'),
  deliveryAddress: z
    .string()
    .trim()
    .min(10, 'সম্পূর্ণ ঠিকানা লিখুন (কমপক্ষে ১০ অক্ষর)')
    .max(500, 'ঠিকানা অনেক বড়'),
  deliveryNote: z.string().trim().max(300, 'নোট অনেক বড়').optional().or(z.literal('')),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>