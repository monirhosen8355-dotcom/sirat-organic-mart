import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// vite.config.ts-এর plugins (react, tailwindcss) অপরিবর্তিত রেখে শুধু টেস্ট-নির্দিষ্ট
// কনফিগ যোগ করা হলো — যাতে টেস্ট আর dev/build একই বেস কনফিগ শেয়ার করে।
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // ডিফল্ট 'node' এনভায়রনমেন্টে window/localStorage থাকে না, তাই
      // cartStore.ts-এর zustand persist middleware "storage is currently
      // unavailable" warning দিত। jsdom সেট করায় localStorage পাওয়া যাবে,
      // warning চলে যাবে।
      environment: 'jsdom',
      // firestore.rules.test.ts emulator-নির্ভর — এটা "npm run test"-এ চালানো
      // যাবে না (emulator ছাড়া fail করবে), শুধু "npm run test:rules"-এ
      // vitest.rules.config.ts দিয়ে আলাদাভাবে চলবে।
      //
      // e2e/**.spec.ts ফাইলগুলো Playwright-এর জন্য লেখা (test.describe থেকে
      // Playwright API আসে, vitest-এর না) — vitest-এর ডিফল্ট exclude
      // (শুধু node_modules আর .git) এগুলো বাদ দেয় না, তাই vitest glob করে এগুলো
      // তুলে নিয়ে চালানোর চেষ্টা করত এবং সবসময় ব্যর্থ suite হিসেবে রিপোর্ট হতো।
      //
      // functions/lib/** হলো functions/src/**-এর কম্পাইল্ড (tsc build) আউটপুট —
      // এটাও সোর্স না, তাই টেস্ট রানের জন্য প্রাসঙ্গিক না; CommonJS হওয়ায়
      // vitest import করতে গেলে ব্যর্থ হতো।
      exclude: [
        ...configDefaults.exclude,
        'firestore.rules.test.ts',
        'e2e/**',
        'functions/lib/**',
        'dist/**',
      ],
    },
  })
)