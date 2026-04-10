import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Production asset base. Default "/" for Netlify, Vercel, etc. Set BASE_PATH for GitHub Pages project sites, e.g. BASE_PATH=csv-analyzer-online */
function productionBase() {
  const raw = process.env.BASE_PATH?.trim()
  if (!raw || raw === '/') return '/'
  const inner = raw.replace(/^\/+|\/+$/g, '')
  return `/${inner}/`
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? productionBase() : '/',
}))
