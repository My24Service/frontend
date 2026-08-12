import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import * as path from 'node:path'

// Deliberately separate from vite.config.js: the app build pulls in the theme
// preprocessor, tailwind and the icon/component resolvers, none of which the
// tests need. Vitest 4 no longer reads a `test` block out of vite.config.js.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.json', '.vue'],
    alias: {
      '@': path.resolve('./src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/unit/setupTests.js'],
    include: ['tests/unit/**/*.spec.js'],
  },
})
