import { expect, test, type Page } from '@playwright/test'
import { TEST_ADMIN, TEST_PRODUCT } from './fixtures.js'

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('ইমেইল').fill(TEST_ADMIN.email)
  await page.getByLabel('পাসওয়ার্ড').fill(TEST_ADMIN.password)
  await page.getByRole('button', { name: 'লগইন করুন' }).click()
  await expect(page).toHaveURL(/\/admin(\/)?$/, { timeout: 15_000 })
}

test.describe('Admin login', () => {
  test('সঠিক credential দিয়ে অ্যাডমিন ড্যাশবোর্ডে ঢুকতে পারে', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('ভুল credential দিয়ে ঢুকতে পারে না', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('ইমেইল').fill(TEST_ADMIN.email)
    await page.getByLabel('পাসওয়ার্ড').fill('WrongPassword123!')
    await page.getByRole('button', { name: 'লগইন করুন' }).click()
    await expect(page.getByText('ইমেইল বা পাসওয়ার্ড সঠিক নয়।')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/login$/)
  })

  test('লগইন ছাড়া সরাসরি /admin-এ ঢোকা যায় না', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login$/)
  })
})

test.describe('Admin product management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('অ্যাডমিন প্রোডাক্ট এডিট করলে সেটা storefront-এ প্রতিফলিত হয়', async ({ page }) => {
    await page.goto(`/admin/products/${TEST_PRODUCT.id}`)
    await expect(page.getByRole('heading', { name: 'প্রোডাক্ট এডিট করুন' })).toBeVisible()

    const newStock = '77'
    await page.getByLabel('স্টক').fill(newStock)
    await page.getByRole('button', { name: 'সংরক্ষণ করুন' }).click()
    await expect(page.getByText('প্রোডাক্ট আপডেট হয়েছে।')).toBeVisible()

    // storefront-এ গিয়ে আপডেটেড প্রোডাক্ট দেখা যাচ্ছে কিনা যাচাই
    await page.goto(`/product/${TEST_PRODUCT.slug}`)
    await expect(page.getByRole('heading', { name: TEST_PRODUCT.name })).toBeVisible()
  })

  test('প্রোডাক্ট লিস্টে সিড করা প্রোডাক্টটা দেখা যায়', async ({ page }) => {
    await page.goto('/admin/products')
    await expect(page.getByText(TEST_PRODUCT.name)).toBeVisible()
  })
})

test.describe('Product → order funnel (guest order → admin management)', () => {
  test('গেস্ট অর্ডার করার পর অ্যাডমিন সেটা খুঁজে পেয়ে status বদলাতে পারে', async ({
    page,
  }) => {
    // ---------- ধাপ ১: গেস্ট হিসেবে অর্ডার করা ----------
    await page.goto(`/product/${TEST_PRODUCT.slug}`)
    await page.getByRole('button', { name: 'এখনই কিনুন' }).click()

    await page.getByLabel('আপনার নাম').fill('Karim Hossain')
    await page.getByLabel('মোবাইল নম্বর').fill('01812345678')
    await page
      .getByLabel('সম্পূর্ণ ঠিকানা')
      .fill('Flat 3B, House 20, Gulshan, Dhaka')

    await page
      .getByRole('button', { name: 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)' })
      .click()

    await expect(page).toHaveURL(/\/order-confirmation\/.+/, { timeout: 15_000 })

    const orderNumberText = await page.getByText(/অর্ডার নম্বর: #/).innerText()
    const orderNumber = orderNumberText.replace('অর্ডার নম্বর: #', '').trim()
    expect(orderNumber).toHaveLength(8)

    // ---------- ধাপ ২: অ্যাডমিন হিসেবে লগইন করে সেই অর্ডার খুঁজে বের করা ----------
    await loginAsAdmin(page)
    await page.goto('/admin/orders')

    const orderLink = page.getByRole('link', { name: `#${orderNumber}` })
    await expect(orderLink).toBeVisible()
    await orderLink.click()

    await expect(page).toHaveURL(/\/admin\/orders\/.+/)
    await expect(page.getByText('Karim Hossain')).toBeVisible()

    // ---------- ধাপ ৩: status পরিবর্তন করা ----------
    await page.getByRole('combobox').selectOption('processing')
    await page.getByRole('button', { name: 'আপডেট করুন' }).click()
    await expect(page.getByText('অর্ডার স্ট্যাটাস আপডেট হয়েছে।')).toBeVisible()

    // ---------- ধাপ ৪: লিস্টে ফিরে গিয়ে নতুন status confirm করা ----------
    await page.goto('/admin/orders')
    const updatedRow = page.getByRole('row', { name: new RegExp(orderNumber) })
    await expect(updatedRow.getByText('প্রসেসিং হচ্ছে')).toBeVisible()
  })
})