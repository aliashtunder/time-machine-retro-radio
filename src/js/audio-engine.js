/**
 * Web Audio API engine — procedural station audio, static, clicks, recording.
 */

export class AudioEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null
    /** @type {GainNode | null} */
    this.master = null
    /** @type {GainNode | null} */
    this.staticGain = null
    /** @type {GainNode | null} */
    this.stationGain = null
    /** @type {AnalyserNode | null} */
    this.analyser = null
    this._nodes = []
    this._intervals = []
    this._currentProfile = null
    this._volume = 0.7
    this._powered = false
    this._recording = null
    this._recordedBlob = null
    this._playbackSource = null
  }

  async init() {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.master = this.ctx.createGain()
    this.staticGain = this.ctx.createGain()
    this.stationGain = this.ctx.createGain()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256

    this.staticGain.connect(this.master)
    this.stationGain.connect(this.master)
    this.master.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    this.master.gain.value = 0
    this.staticGain.gain.value = 0
    this.stationGain.gain.value = 0

    this._staticNode = this._createStaticNoise()
    this._staticNode.connect(this.staticGain)
  }

  async resume() {
    await this.init()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v))
    if (this._powered && this.master) {
      this.master.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.02)
    }
  }

  setPowered(on) {
    this._powered = on
    if (!this.master) return
    const target = on ? this._volume : 0
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05)
  }

  /** @param {number} staticMix 0–1 */
  /** @param {string | null} profile */
  updateTuning(staticMix, profile) {
    if (!this.ctx || !this._powered) return

    this.staticGain.gain.setTargetAtTime(staticMix * 0.35 * this._volume, this.ctx.currentTime, 0.03)

    const stationVol = (1 - staticMix * 0.85) * this._volume
    this.stationGain.gain.setTargetAtTime(stationVol, this.ctx.currentTime, 0.03)

    if (profile !== this._currentProfile) {
      this._stopStationNodes()
      this._currentProfile = profile
      if (profile && profile !== 'static') {
        this._startProfile(profile)
      }
    }
  }

  playClick() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 1200
    g.gain.value = 0.08
    osc.connect(g)
    g.connect(this.ctx.destination)
    osc.start()
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06)
    osc.stop(this.ctx.currentTime + 0.07)
  }

  /** Bass level 0–1 for speaker animation */
  getBassLevel() {
    if (!this.analyser || !this._powered) return 0
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(data)
    let sum = 0
    const bins = Math.min(8, data.length)
    for (let i = 0; i < bins; i++) sum += data[i]
    return sum / (bins * 255)
  }

  /** Start microphone recording */
  async startRecording() {
    await this.resume()
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this._recording = new MediaRecorder(stream)
    this._chunks = []
    this._recording.ondataavailable = (e) => this._chunks.push(e.data)
    this._recording.start()
    return true
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this._recording) return resolve(null)
      this._recording.onstop = () => {
        this._recordedBlob = new Blob(this._chunks, { type: 'audio/webm' })
        this._recording.stream.getTracks().forEach((t) => t.stop())
        this._recording = null
        resolve(this._recordedBlob)
      }
      this._recording.stop()
    })
  }

  playRecording() {
    if (!this._recordedBlob || !this.ctx) return
    this.stopRecordingPlayback()
    const url = URL.createObjectURL(this._recordedBlob)
    const audio = new Audio(url)
    audio.volume = this._volume
    this._playbackSource = audio
    audio.play()
    audio.onended = () => URL.revokeObjectURL(url)
  }

  stopRecordingPlayback() {
    if (this._playbackSource) {
      this._playbackSource.pause()
      this._playbackSource = null
    }
  }

  hasRecording() {
    return !!this._recordedBlob
  }

  destroy() {
    this._stopStationNodes()
    this._intervals.forEach(clearInterval)
    this._intervals = []
    this.ctx?.close()
  }

  _createStaticNoise() {
    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    src.start()

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 0.5
    src.connect(filter)
    return filter
  }

  _stopStationNodes() {
    this._nodes.forEach((n) => {
      try {
        n.stop?.()
        n.disconnect?.()
      } catch (_) {}
    })
    this._nodes = []
    this._intervals.forEach(clearInterval)
    this._intervals = []
  }

  _track(node) {
    this._nodes.push(node)
    return node
  }

  _startProfile(profile) {
    const starters = {
      pop: () => this._startPop(),
      rock: () => this._startRock(),
      hiphop: () => this._startHiphop(),
      talk: () => this._startTalk(),
      news: () => this._startNews(),
      future: () => this._startFuture(),
      static: () => {},
    }
    starters[profile]?.()
  }

  _connectStation(node) {
    node.connect(this.stationGain)
  }

  _makeOsc(type, freq, gain = 0.08) {
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.value = gain
    osc.connect(g)
    this._connectStation(g)
    osc.start()
    return { osc, g }
  }

  _startPop() {
    const chords = [
      [261.63, 329.63, 392.0],
      [293.66, 369.99, 440.0],
      [329.63, 415.3, 493.88],
      [349.23, 440.0, 523.25],
    ]
    let step = 0
    const play = () => {
      const chord = chords[step % chords.length]
      chord.forEach((f, i) => {
        const { osc, g } = this._makeOsc('square', f, 0.04)
        g.gain.setTargetAtTime(0, this.ctx.currentTime + 0.35, 0.05)
        osc.stop(this.ctx.currentTime + 0.45)
        this._track(osc)
      })
      step++
    }
    play()
    this._intervals.push(setInterval(play, 480))
  }

  _startRock() {
    const riff = [82.41, 82.41, 98.0, 110.0, 82.41, 123.47, 110.0, 98.0]
    let i = 0
    const play = () => {
      const f = riff[i % riff.length]
      const { osc, g } = this._makeOsc('sawtooth', f, 0.1)
      const dist = this.ctx.createWaveShaper()
      dist.curve = this._distortionCurve(80)
      g.disconnect()
      g.connect(dist)
      dist.connect(this.stationGain)
      g.gain.setTargetAtTime(0, this.ctx.currentTime + 0.2, 0.04)
      osc.stop(this.ctx.currentTime + 0.25)
      this._track(osc)
      i++
    }
    play()
    this._intervals.push(setInterval(play, 320))
  }

  _distortionCurve(amount) {
    const n = 44100
    const curve = new Float32Array(n)
    const k = amount
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x))
    }
    return curve
  }

  _startHiphop() {
    const playKick = () => {
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      osc.frequency.setValueAtTime(150, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15)
      g.gain.setValueAtTime(0.25, this.ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)
      osc.connect(g)
      g.connect(this.stationGain)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.25)
      this._track(osc)
    }
    const playHat = () => {
      const bufferSize = this.ctx.sampleRate * 0.05
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const d = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) d[i] = Math.random() * 2 - 1
      const src = this.ctx.createBufferSource()
      src.buffer = buffer
      const g = this.ctx.createGain()
      g.gain.value = 0.06
      const hp = this.ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 7000
      src.connect(hp)
      hp.connect(g)
      g.connect(this.stationGain)
      src.start()
      this._track(src)
    }
    let beat = 0
    const loop = () => {
      if (beat % 2 === 0) playKick()
      if (beat % 1 === 0) playHat()
      beat++
    }
    loop()
    this._intervals.push(setInterval(loop, 250))
  }

  _startTalk() {
    const { osc, g } = this._makeOsc('sawtooth', 120, 0.03)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 2
    g.disconnect()
    g.connect(filter)
    filter.connect(this.stationGain)
    this._track(osc)

    const wobble = () => {
      filter.frequency.setTargetAtTime(300 + Math.random() * 500, this.ctx.currentTime, 0.1)
    }
    this._intervals.push(setInterval(wobble, 600))
  }

  _startNews() {
    const beep = () => {
      const { osc, g } = this._makeOsc('sine', 880, 0.06)
      g.gain.setTargetAtTime(0, this.ctx.currentTime + 0.15, 0.05)
      osc.stop(this.ctx.currentTime + 0.2)
      this._track(osc)
    }
    beep()
    this._intervals.push(setInterval(beep, 2000))
  }

  _startFuture() {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    let i = 0
    const play = () => {
      const { osc, g } = this._makeOsc('sine', notes[i % notes.length], 0.05)
      const delay = this.ctx.createDelay()
      delay.delayTime.value = 0.3
      const fb = this.ctx.createGain()
      fb.gain.value = 0.4
      g.connect(delay)
      delay.connect(fb)
      fb.connect(delay)
      delay.connect(this.stationGain)
      g.gain.setTargetAtTime(0, this.ctx.currentTime + 0.5, 0.1)
      osc.stop(this.ctx.currentTime + 0.6)
      this._track(osc)
      i++
    }
    play()
    this._intervals.push(setInterval(play, 700))
  }
}
