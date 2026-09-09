import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false, // guest-checkout ও admin টেস্ট একই সিড করা Firestore emulator ডেটা শেয়ার করে
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    // ইচ্ছাকৃতভাবে false — যদি ইতিমধ্যে কোনো "npm run dev" চলমান থাকে (আসল
    // Firebase project-এর সাথে কানেক্টেড), সেটা reuse করলে টেস্ট ডেটা ভুলবশত
    // আসল ডাটাবেজে চলে যেতে পারে। প্রতিবার একটা নতুন, emulator-কানেক্টেড
    // dev server-ই চালানো হয়।
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      // config.ts এই flag দেখে Firestore/Auth/Functions emulator-এ কানেক্ট করে —
      // আসল Firebase project-কে কখনো ছোঁয় না।
      VITE_USE_FIREBASE_EMULATORS: 'true',
    },
  },
})