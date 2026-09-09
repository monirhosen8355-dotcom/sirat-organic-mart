import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// firestore.rules.test.ts শুধু এই config দিয়ে চলে (npm run test:rules) —
// main vitest.config.ts থেকে ইচ্ছাকৃতভাবে এটা exclude করা আছে, কারণ এটা
// Firestore Emulator চালু থাকা লাগে, সাধারণ "npm run test"-এ চালানো যায় না।
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['firestore.rules.test.ts'],
    },
  })
)