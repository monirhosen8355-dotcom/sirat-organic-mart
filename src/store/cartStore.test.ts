import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './cartStore'

const sampleItem = {
  productId: 'p1',
  name: 'টেস্ট প্রোডাক্ট',
  image: 'https://example.com/img.jpg',
  price: 100,
  quantity: 1,
  stock: 10,
}

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
  })

  it('নতুন আইটেম যোগ করে', () => {
    useCartStore.getState().addItem(sampleItem)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().itemCount()).toBe(1)
  })

  it('একই প্রোডাক্ট আবার যোগ করলে quantity বাড়ে, নতুন এন্ট্রি হয় না', () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().addItem({ ...sampleItem, quantity: 2 })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('ভিন্ন variant হলে আলাদা এন্ট্রি তৈরি হয়', () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().addItem({ ...sampleItem, variantId: 'v1', variantLabel: '৫০০গ্রাম' })
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('quantity আপডেট করে', () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().updateQuantity('p1', 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('আইটেম সরায়', () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().removeItem('p1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('সাবটোটাল সঠিকভাবে হিসাব করে', () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().addItem({ ...sampleItem, productId: 'p2', price: 50, quantity: 2 })
    expect(useCartStore.getState().subtotal()).toBe(200) // 100*1 + 50*2
  })

  it('কার্ট খালি করে', () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})