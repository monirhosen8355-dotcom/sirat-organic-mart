// এলাকাভিত্তিক ডেলিভারি চার্জ — আপাতত এখানে fixed, ভবিষ্যতে admin panel থেকে
// পরিবর্তনযোগ্য করার পরিকল্পনা আছে (siteSettings collection দিয়ে)।

export type DeliveryZone = 'dhaka' | 'outside'

export const DELIVERY_CHARGES: Record<DeliveryZone, number> = {
  dhaka: 70,
  outside: 120,
}

export const DELIVERY_ZONE_LABELS: Record<DeliveryZone, string> = {
  dhaka: 'ঢাকার ভিতরে',
  outside: 'ঢাকার বাইরে',
}