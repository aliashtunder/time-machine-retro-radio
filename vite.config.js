import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves from https://aliashtunder.github.io/retro-radio/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/retro-radio/' : '/',
  plugins: [tailwindcss()],
}))
