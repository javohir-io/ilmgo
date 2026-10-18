import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Heavy libraries get their own chunks so the landing shell (react + router + css)
// paints before three / r3f / gsap are fetched. The 3D pieces are also lazy() imports.
function manualChunks(id) {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules\/(three|three-stdlib|camera-controls)\//.test(id)) return 'three'
  if (/node_modules\/(@react-three|@shadergradient|react-reconciler|its-fine|zustand|suspend-react|react-use-measure|maath|meshline|troika-[\w-]+|stats-gl|three-mesh-bvh|detect-gpu|webgl-sdf-generator|bidi-js)\//.test(id)) return 'r3f'
  if (/node_modules\/(gsap|@gsap)\//.test(id)) return 'gsap'
  if (/node_modules\/(react|react-dom|react-router|react-router-dom|@remix-run|scheduler)\//.test(id)) return 'react'
  return undefined
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks } },
  },
})
