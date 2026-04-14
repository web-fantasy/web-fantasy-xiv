import { defineConfig } from 'vite'
import { resolve } from 'path'
import preact from '@preact/preset-vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  base: './',
  plugins: [preact(), UnoCSS()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
})
