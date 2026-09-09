import { expect, test } from '@playwright/test'
import { TEST_PRODUCT } from './fixtures.js'

test.describe('Guest checkout funnel', () => {
  test('guest প্রোডাক্ট পেজ থেকে সরাসরি "এখনই কিনুন" দিয়ে অর্ডার কমপ্লিট করতে পারে', async ({
    page,
  }) => {
    await page.goto(`/product/${TEST_PRODUCT.slug}`)
    await expect(page.getByRole('heading', { name: TEST_PRODUCT.name })).toBeVisible()

    await page.getByRole('button', { name: 'এখনই কিনুন' }).click()
    await expect(page).toHaveURL(/\/checkout$/)

    await page.getByLabel('আপনার নাম').fill('Rahim Uddin')
    await page.getByLabel('মোবাইল নম্বর').fill('01712345678')
    await page
      .getByLabel('সম্পূর্ণ ঠিকানা')
      .fill('House 12, Road 4, Dhanmondi, Dhaka')

    await page
      .getByRole('button', { name: 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)' })
      .click()

    await expect(page).toHaveURL(/\/order-confirmation\/.+/, { timeout: 15_000 })
    await expect(page.getByText('অর্ডার সফল হয়েছে!')).toBeVisible()
    await expect(page.getByText(/অর্ডার নম্বর: #/)).toBeVisible()
  })

  test('প্রোডাক্ট পেজ থেকে কার্টে যোগ করে কার্ট হয়ে চেকআউট পর্যন্ত পৌঁছানো যায়', async ({
    page,
  }) => {
    await page.goto(`/product/${TEST_PRODUCT.slug}`)
    await page.getByRole('button', { name: 'কার্টে যোগ করুন' }).click()
    await expect(page.getByText('কার্টে যোগ হয়েছে')).toBeVisible()

    await page.goto('/cart')
    await expect(page.getByText(TEST_PRODUCT.name)).toBeVisible()

    await page.getByRole('link', { name: 'চেকআউট করুন' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
  })
})