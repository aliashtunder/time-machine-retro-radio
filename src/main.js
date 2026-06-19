import './style.css'
import { RetroRadio } from './js/radio.js'

const root = document.getElementById('radio-app')
if (root) {
  const radio = new RetroRadio(root)

  // Resume audio context on first interaction anywhere
  const unlock = () => {
    radio.audio.resume()
    document.removeEventListener('pointerdown', unlock)
    document.removeEventListener('keydown', unlock)
  }
  document.addEventListener('pointerdown', unlock)
  document.addEventListener('keydown', unlock)
}
