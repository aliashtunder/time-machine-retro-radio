/**
 * Drag / keyboard rotary knob controller.
 */
export class Knob {
  /**
   * @param {HTMLElement} el - knob element (must contain .knob-dial)
   * @param {object} opts
   * @param {number} opts.min
   * @param {number} opts.max
   * @param {number} opts.value
   * @param {number} [opts.step=0.1]
   * @param {number} [opts.rotationRange=270]
   * @param {number} [opts.startAngle=-135]
   * @param {(v: number) => void} opts.onChange
   * @param {boolean} [opts.disabled=false]
   */
  constructor(el, opts) {
    this.el = el
    this.dial = el.querySelector('.knob-dial') ?? el
    this.min = opts.min
    this.max = opts.max
    this.step = opts.step ?? 0.1
    this.rotationRange = opts.rotationRange ?? 270
    this.startAngle = opts.startAngle ?? -135
    this.onChange = opts.onChange
    this._disabled = opts.disabled ?? false
    this._dragging = false
    this._value = opts.value

    el.setAttribute('role', 'slider')
    el.setAttribute('tabindex', '0')
    this._syncAria()
    this._render()

    el.addEventListener('pointerdown', this._onDown)
    el.addEventListener('keydown', this._onKey)
    el.addEventListener('wheel', this._onWheel, { passive: false })
  }

  get value() {
    return this._value
  }

  set value(v) {
    this._value = Math.max(this.min, Math.min(this.max, v))
    this._render()
    this._syncAria()
  }

  set disabled(v) {
    this._disabled = v
    this.el.setAttribute('aria-disabled', String(v))
    if (v) this.el.setAttribute('tabindex', '-1')
    else this.el.setAttribute('tabindex', '0')
  }

  destroy() {
    this.el.removeEventListener('pointerdown', this._onDown)
    this.el.removeEventListener('keydown', this._onKey)
    this.el.removeEventListener('wheel', this._onWheel)
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('pointerup', this._onUp)
  }

  _syncAria() {
    this.el.setAttribute('aria-valuemin', String(this.min))
    this.el.setAttribute('aria-valuemax', String(this.max))
    this.el.setAttribute('aria-valuenow', this._value.toFixed(1))
  }

  _pct() {
    return (this._value - this.min) / (this.max - this.min)
  }

  _render() {
    const deg = this.startAngle + this._pct() * this.rotationRange
    this.dial.style.transform = `rotate(${deg}deg)`
  }

  _emit() {
    this.onChange?.(this._value)
  }

  _angleFromEvent(e) {
    const rect = this.el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
  }

  _onDown = (e) => {
    if (this._disabled) return
    e.preventDefault()
    this._dragging = true
    this._lastAngle = this._angleFromEvent(e)
    this.el.setPointerCapture(e.pointerId)
    this.el.classList.add('knob-active')
    window.addEventListener('pointermove', this._onMove)
    window.addEventListener('pointerup', this._onUp)
  }

  _onMove = (e) => {
    if (!this._dragging) return
    const angle = this._angleFromEvent(e)
    let delta = angle - this._lastAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    this._lastAngle = angle

    const range = this.max - this.min
    const deltaVal = (delta / this.rotationRange) * range
    this.value = this._value + deltaVal
    this._emit()
  }

  _onUp = () => {
    this._dragging = false
    this.el.classList.remove('knob-active')
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('pointerup', this._onUp)
  }

  _onKey = (e) => {
    if (this._disabled) return
    const keys = {
      ArrowUp: this.step,
      ArrowRight: this.step,
      ArrowDown: -this.step,
      ArrowLeft: -this.step,
    }
    if (keys[e.key] !== undefined) {
      e.preventDefault()
      this.value = this._value + keys[e.key]
      this._emit()
    }
  }

  _onWheel = (e) => {
    if (this._disabled) return
    e.preventDefault()
    const dir = e.deltaY > 0 ? -1 : 1
    this.value = this._value + dir * this.step
    this._emit()
  }
}
