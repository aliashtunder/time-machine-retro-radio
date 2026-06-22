import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves from https://aliashtunder.github.io/retro-radio/
export default defineConfig(({ command }) => {
  const isNetlify = Boolean(process.env.NETLIFY);
  const isVercel = Boolean(process.env.VERCEL) || process.env.VERCEL === '1';
  // For GitHub Pages we need the repo subpath; for Netlify/Vercel (root) use '/'.
  const baseForBuild = isNetlify || isVercel ? '/' : '/time-machine-retro-radio/';
  return {
    base: command === 'build' ? baseForBuild : '/',
    plugins: [tailwindcss()],
    build: {
      // When building on Netlify or Vercel use `dist` (platform default). For GitHub Pages use `docs`.
      outDir: isNetlify || isVercel ? 'dist' : 'docs',
    },
  };
})
