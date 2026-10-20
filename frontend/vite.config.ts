import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  css: {
    modules: {
      // short hashed class names in builds keep the prerendered HTML lean
      // (better text-to-HTML ratio); readable names while developing
      generateScopedName: command === 'build' ? '_[hash:base64:6]' : '_[local]_[hash:base64:5]',
    },
  },
}))
