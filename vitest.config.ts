/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'src/utils/**',
        'src/lib/**',
        'src/store/**',
        'src/hooks/**',
        'src/components/ui/**',
        'src/router/**',
      ],
      exclude: [
        'src/lib/supabase.ts',
        'src/lib/queryClient.ts',
        'src/types/**',
        'src/constants/**',
      ],
    },
  },
})
