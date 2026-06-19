import { AudioEngine } from './audio-engine.js'
import { Knob } from './knobs.js'
import {
  STATIONS,
  FREQ_MIN,
  FREQ_MAX,
  nearestStation,
  signalStrength,
  formatFrequency,
  stationByPreset,
} from './stations.js'

const FUTURE_RECOMMENDATIONS = [
  { title: 'Neon Nostalgia', artist: 'Synthwave Collective', vibe: 'Like 1999 met 2026' },
  { title: 'Dial-Up Dreams', artist: 'Lo-Fi Oracle', vibe: 'Perfect for late-night tuning' },
  { title: 'Bass Drop at Midnight', artist: 'Future FM DJs', vibe: 'Speaker-shaking energy' },
  { title: 'Chrome Heartbreak', artist: 'Digital Cassette', vibe: '90s tears, modern beats' },
  { title: 'Static & Stardust', artist: 'AI Radio Unit 7', vibe: 'Hidden frequency detected' },
]

export class RetroRadio {
  constructor(root) {
    this.root = root
    this.audio = new AudioEngine()
    this.powered = false
    this.frequency = 91.7
    this.volume = 0.65
    this.battery = 100
    this.recording = false
    this.quoteIndex = 0

    this._cacheDom()
    this._bindKnobs()
    this._bindControls()
    this._startLoops()
    this._render()
  }

  _cacheDom() {
    const q = (sel) => this.root.querySelector(sel)
    this.els = {
      boombox: q('#boombox'),
      powerBtn: q('#power-btn'),
      freqDisplay: q('#freq-display'),
      stationLabel: q('#station-label'),
      signalMeter: q('#signal-meter'),
      signalFill: q('#signal-fill'),
      batteryFill: q('#battery-fill'),
      batteryPct: q('#battery-pct'),
      cassette: q('#cassette'),
      reelLeft: q('#reel-left'),
      reelRight: q('#reel-right'),
      antenna: q('#antenna'),
      speakers: this.root.querySelectorAll('.speaker-grill'),
      presetBtns: this.root.querySelectorAll('[data-preset]'),
      recordBtn: q('#record-btn'),
      recordLed: q('#record-led'),
      futureModal: q('#future-modal'),
      futureClose: q('#future-close'),
      futureRecs: q('#future-recs'),
      ticker: q('#news-ticker'),
    }
  }

  _bindKnobs() {
    this.tuneKnob = new Knob(this.root.querySelector('#tune-knob'), {
      min: FREQ_MIN,
      max: FREQ_MAX,
      value: this.frequency,
      step: 0.1,
      onChange: (v) => this.setFrequency(v),
      disabled: true,
    })

    this.volumeKnob = new Knob(this.root.querySelector('#volume-knob'), {
      min: 0,
      max: 1,
      value: this.volume,
      step: 0.02,
      onChange: (v) => this.setVolume(v),
      disabled: true,
    })
  }

  _bindControls() {
    this.els.powerBtn.addEventListener('click', () => this.togglePower())

    this.els.presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = Number(btn.dataset.preset)
        const station = stationByPreset(preset)
        if (station) this.tuneToStation(station.frequency)
      })
    })

    this.els.recordBtn.addEventListener('click', () => this.toggleRecord())
    this.els.futureClose?.addEventListener('click', () => this._hideFutureModal())

    this.els.cassette?.addEventListener('click', () => {
      if (this.audio.hasRecording() && !this.recording) {
        this.audio.playRecording()
      }
    })

    this.els.antenna?.addEventListener('click', () => {
      this.els.antenna.classList.toggle('antenna-extended')
      this.audio.playClick()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._hideFutureModal()
    })
  }

  _startLoops() {
    const bassLoop = () => {
      if (!this.powered) return
      const level = this.audio.getBassLevel()
      const scale = 1 + level * 0.08
      this.els.speakers.forEach((sp) => {
        sp.style.transform = `scale(${scale})`
      })
      requestAnimationFrame(bassLoop)
    }
    requestAnimationFrame(bassLoop)

    setInterval(() => {
      if (!this.powered) return
      this.battery = Math.max(0, this.battery - 0.08)
      this._updateBattery()
    }, 3000)

    setInterval(() => {
      if (!this.powered) return
      this._updateTicker()
    }, 5000)
  }

  async togglePower() {
    await this.audio.resume()
    this.audio.playClick()
    this.powered = !this.powered
    this.els.boombox.classList.toggle('powered', this.powered)
    this.els.boombox.classList.toggle('powered-off', !this.powered)
    this.els.powerBtn.setAttribute('aria-pressed', String(this.powered))
    this.tuneKnob.disabled = !this.powered
    this.volumeKnob.disabled = !this.powered
    this.audio.setPowered(this.powered)

    if (this.powered) {
      this.els.cassette?.classList.add('playing')
      this._updateAudio()
    } else {
      this.els.cassette?.classList.remove('playing')
      this._hideFutureModal()
    }
    this._render()
  }

  setFrequency(freq) {
    this.frequency = freq
    this._render()
    this._updateAudio()
  }

  setVolume(v) {
    this.volume = v
    this.audio.setVolume(v)
    this.root.querySelector('#volume-knob')?.setAttribute('aria-valuetext', `${Math.round(v * 100)} percent`)
  }

  tuneToStation(freq) {
    if (!this.powered) return
    this.audio.playClick()
    this.frequency = freq
    this.tuneKnob.value = freq
    this._render()
    this._updateAudio()
    this._checkFutureStation()
  }

  _updateAudio() {
    if (!this.powered) return
    const strength = signalStrength(this.frequency)
    const station = nearestStation(this.frequency)
    const staticMix = 1 - strength
    const profile = strength > 0.55 ? station.profile : 'static'
    this.audio.updateTuning(staticMix, profile)
  }

  _checkFutureStation() {
    const station = nearestStation(this.frequency)
    if (station.id === 'future' && signalStrength(this.frequency) > 0.7) {
      this._showFutureModal()
    }
  }

  _showFutureModal() {
    if (!this.els.futureModal) return
    this.els.futureRecs.innerHTML = FUTURE_RECOMMENDATIONS.map(
      (r) => `
        <li class="future-rec-item">
          <strong>${r.title}</strong>
          <span>${r.artist}</span>
          <em>${r.vibe}</em>
        </li>`,
    ).join('')
    this.els.futureModal.hidden = false
    this.els.futureModal.setAttribute('aria-hidden', 'false')
  }

  _hideFutureModal() {
    if (!this.els.futureModal) return
    this.els.futureModal.hidden = true
    this.els.futureModal.setAttribute('aria-hidden', 'true')
  }

  async toggleRecord() {
    if (!this.powered) return
    this.audio.playClick()

    if (this.recording) {
      this.recording = false
      this.els.recordBtn.classList.remove('recording')
      this.els.recordLed?.classList.remove('on')
      await this.audio.stopRecording()
      this.els.cassette?.classList.add('has-memo')
    } else {
      try {
        await this.audio.startRecording()
        this.recording = true
        this.els.recordBtn.classList.add('recording')
        this.els.recordLed?.classList.add('on')
      } catch {
        this.els.stationLabel.textContent = 'MIC ACCESS DENIED'
      }
    }
  }

  _updateBattery() {
    if (!this.els.batteryFill) return
    this.els.batteryFill.style.width = `${this.battery}%`
    this.els.batteryPct.textContent = `${Math.round(this.battery)}%`
    if (this.battery < 15) this.els.batteryFill.classList.add('low')
  }

  _updateTicker() {
    const station = nearestStation(this.frequency)
    if (!station.quotes || signalStrength(this.frequency) < 0.5) {
      this.els.ticker.textContent = ''
      return
    }
    this.quoteIndex = (this.quoteIndex + 1) % station.quotes.length
    this.els.ticker.textContent = station.quotes[this.quoteIndex]
  }

  _render() {
    const station = nearestStation(this.frequency)
    const strength = signalStrength(this.frequency)
    const locked = strength > 0.55

    this.els.freqDisplay.textContent = formatFrequency(this.frequency)
    this.els.stationLabel.textContent = locked ? station.label : 'SCANNING...'
    this.els.freqDisplay.classList.toggle('locked', locked)
    this.els.signalFill.style.width = `${strength * 100}%`

    this._updatePresetHighlight(station, locked)

    if (locked && station.id === 'future') this._checkFutureStation()
  }

  _updatePresetHighlight(station, locked) {
    this.els.presetBtns.forEach((btn) => {
      const preset = Number(btn.dataset.preset)
      const isActive = this.powered && locked && station.preset === preset
      btn.classList.toggle('active', isActive)
      btn.setAttribute('aria-pressed', String(isActive))
    })
  }

  destroy() {
    this.tuneKnob.destroy()
    this.volumeKnob.destroy()
    this.audio.destroy()
  }
}
