import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const appBase = env.VITE_DEMO_MODE === 'true' ? '/AshenSpire-Council/' : './'

  return {
    base: appBase,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/apple-touch-icon.png'],
        manifest: {
          id: appBase,
          name: 'AshenSpire Council',
          short_name: 'Council',
          description: 'A persistent voice meeting room for the AshenSpire agent council.',
          start_url: appBase,
          scope: appBase,
          display: 'standalone',
          orientation: 'any',
          background_color: '#08131b',
          theme_color: '#08131b',
          categories: ['productivity', 'utilities'],
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cacheId: 'ashenspire-council-v1',
          globPatterns: ['**/*.{html,js,css,json}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [
            /\/api(?:\/|$)/,
            /\/audio(?:\/|$)/,
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          skipWaiting: false,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      proxy: { '/api': 'http://127.0.0.1:8421' },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
