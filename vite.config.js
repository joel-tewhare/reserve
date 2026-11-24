import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
})
