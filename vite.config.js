import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: { proxy: {
    '/api': 'http://127.0.0.1:8787',
    '/functions/searchPlaces': {
      target: 'http://127.0.0.1:5001',
      rewrite: (path) => path.replace('/functions/searchPlaces', '/demo-cyclewise/australia-southeast1/searchPlaces'),
    },
  } },
})
