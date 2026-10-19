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
  showOnHomepage?: boolean
  homeOrder?: number
}

// ---------- Home Banner ----------
export interface HomeBanner {
  id: string
  imageUrl: string
  linkUrl?: string
  altText: string
  title?: string
  subtitle?: string
  ctaText?: string
  order: number
  active: boolean
  placement?: 'hero' | 'middle' | 'triple'
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
  type: 'normal' | 'affiliate'
  name: string
  slug: string
  shortDescription: string
  fullDescription: string
  price?: number
  priceCurrency?: string
  discountPrice?: number
  stock?: number
  sku: string
  affiliateUrl?: string
  categoryId: string
  images: string[] // Cloudinary URLs
  brand?: string
  keywords?: string[]
  tags?: string[]
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
  productType?: Product['type']
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
  deliveryZone: 'dhaka' | 'outside'
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
  stockDeductedAt?: number
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

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

export interface SiteFooterSettings {
  storeName: string
  description: string
  phone: string
  email: string
  whatsapp: string
  facebook: string
  instagram: string
  youtube: string
  sections: FooterSection[]
  paymentMethods: string[]
  trustItems: string[]
  copyrightText: string
  updatedAt: number
  updatedBy?: string
}

// ---------- Customer Support ----------
export interface SupportFAQ {
  id: string
  question: string
  answer: string
  order: number
  active: boolean
  createdAt: number
  updatedAt: number
  updatedBy?: string
}

export interface SupportConversation {
  id: string
  customerId: string
  customerName: string
  customerEmail?: string
  lastMessage: string
  lastMessageAt: number
  unreadForAdmin: boolean
  unreadForCustomer: boolean
  createdAt: number
  updatedAt: number
}

export interface SupportMessage {
  id: string
  conversationId: string
  senderId: string
  senderRole: 'customer' | 'admin'
  text: string
  createdAt: number
}

// ---------- Brand ----------
export interface Brand {
  id: string
  name: string
  logoUrl: string
  linkUrl?: string
  order: number
  active: boolean
}