import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves from https://aliashtunder.github.io/retro-radio/
export default defineConfig(({ command }) => ({
  // Use the repository name so asset paths resolve on GitHub Pages.
  // When building for production, Vite will prefix assets with this base.
  base: command === 'build' ? '/time-machine-retro-radio/' : '/',
  plugins: [tailwindcss()],
  build: {
    // Output to `docs/` so GitHub Pages can serve from `main` -> `/docs`.
    outDir: 'docs',
  },
}))
