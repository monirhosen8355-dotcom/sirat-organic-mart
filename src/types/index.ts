// ---------- User ----------
export interface UserProfile {
  uid: string
  name: string
  phone: string
  email?: string
  createdAt: number
}

export interface Address {
  id: string
  label: string // যেমন "বাসা", "অফিস"
  fullAddress: string
  phone: string
  isDefault: boolean
}

// ---------- Category ----------
export interface Category {
  id: string
  name: string
  slug: string
  imageUrl?: string
  active: boolean
  order: number
}

// ---------- Product ----------
export interface ProductVariant {
  id: string
  label: string // যেমন "৫০০ গ্রাম", "১ কেজি"
  priceModifier: number // মূল দামের সাথে যোগ/বিয়োগ
  stock: number
  sku: string
}

export interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string
  fullDescription: string
  price: number
  discountPrice?: number
  stock: number
  sku: string
  categoryId: string
  images: string[] // Cloudinary URLs
  featured: boolean
  active: boolean
  seoTitle?: string
  seoDescription?: string
  variants?: ProductVariant[]
  rating?: number
  reviewCount?: number
  createdAt: number
  updatedAt: number
}

// ---------- Cart ----------
export interface CartItem {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  variantId?: string
  variantLabel?: string
  stock: number
}

// ---------- Order ----------
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  image: string
  price: number // purchase-time snapshot
  quantity: number
  variantId?: string
  variantLabel?: string
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  timestamp: number
  note?: string
}

export interface Order {
  id: string
  userId?: string // guest হলে undefined
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryNote?: string
  items: OrderItem[]
  subtotal: number
  deliveryCharge: number
  discount: number
  couponCode?: string
  total: number
  paymentMethod: 'cod'
  status: OrderStatus
  courierTrackingId?: string // ভবিষ্যতের জন্য, এখন unused
  createdAt: number
}

// ---------- Coupon ----------
export interface Coupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  expiresAt?: number
  active: boolean
}

// ---------- Review ----------
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number // 1-5
  comment: string
  approved: boolean
  createdAt: number
}

// ---------- Legal Page ----------
export type LegalPageSlug =
  | 'about'
  | 'privacy-policy'
  | 'terms'
  | 'returns-refunds'
  | 'delivery-information'
  | 'contact'

export interface LegalPage {
  slug: LegalPageSlug
  title: string
  content: string
  updatedAt: number
}

// ---------- Site Settings ----------
export interface MetaPixelSettings {
  pixelId: string
  enabled: boolean
  updatedAt: number
  updatedBy?: string
}