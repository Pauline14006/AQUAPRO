import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Keep kebab-case class names readable in dev tools: `admin_stat-card_x1y2`
      generateScopedName: '[name]_[local]_[hash:base64:4]',
    },
  },
})
