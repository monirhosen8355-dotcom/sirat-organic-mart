import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
        extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // fetch-on-mount effect প্যাটার্নে (setIsLoading(true) → fetch → finally) এই rule
      // false-positive দেয়; আমাদের কোডে cancelled flag দিয়ে race condition আগে থেকেই
      // আটকানো আছে, তাই এটা বন্ধ রাখা হলো। বাকি সব react-hooks rule সক্রিয় থাকছে।
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
