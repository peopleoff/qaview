import pkg from './package.json'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

fs.rmSync(path.join(__dirname, 'dist-electron'), { recursive: true, force: true })

// Configuration for main process (can use ES modules)
const viteMainConfig = {
  build: {
    minify: process.env.NODE_ENV === 'production',
    rollupOptions: {
      external: [
        ...Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
        'playwright',
        'playwright-core',
        '@playwright/test',
        'chromium-bidi',
      ],
    },
  },
  resolve: {
    alias: {
      '~': __dirname,
    },
  },
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', 'nuxt-mcp', 'nuxt-electron'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  nitro: {
    static: true,
  },
  // Disable build manifest checker in SSR-disabled mode to prevent fetch errors
  experimental: {
    appManifest: false,
  },
  electron: {
    build: [
      {
        entry: 'electron/main.ts',
        vite: viteMainConfig, // ES modules for main process
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload()
        },
        vite: viteMainConfig, // ESM works with sandbox disabled
      },
    ],
  },
})