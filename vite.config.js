import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves from https://aliashtunder.github.io/retro-radio/
export default defineConfig(({ command }) => {
  const isNetlify = Boolean(process.env.NETLIFY);
  // For GitHub Pages we need the repo subpath; for Netlify (root) use '/'.
  const baseForBuild = isNetlify ? '/' : '/time-machine-retro-radio/';
  return {
    base: command === 'build' ? baseForBuild : '/',
    plugins: [tailwindcss()],
    build: {
      // When building on Netlify use `dist` (Netlify default). For GitHub Pages use `docs`.
      outDir: isNetlify ? 'dist' : 'docs',
    },
  };
})
