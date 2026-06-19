/**
 * Radio station definitions — frequency, metadata, and audio profiles.
 * Frequencies span 88.0–108.0 FM like a real tuner dial.
 */

export const STATIONS = [
  {
    id: 'static',
    frequency: 88.3,
    name: 'STATIC',
    label: '▓▓ NO SIGNAL ▓▓',
    preset: null,
    profile: 'static',
    color: '#666',
  },
  {
    id: 'pop',
    frequency: 91.7,
    name: 'HIT FM',
    label: '90s POP HITS',
    preset: 1,
    profile: 'pop',
    color: '#ff6b35',
  },
  {
    id: 'rock',
    frequency: 95.1,
    name: 'ROCK 95',
    label: 'CLASSIC ROCK',
    preset: 2,
    profile: 'rock',
    color: '#e63946',
  },
  {
    id: 'hiphop',
    frequency: 98.7,
    name: 'BEAT 98',
    label: 'HIP-HOP / RAP',
    preset: 3,
    profile: 'hiphop',
    color: '#ffd166',
  },
  {
    id: 'talk',
    frequency: 101.5,
    name: 'TALK 101',
    label: 'TALK RADIO',
    preset: 4,
    profile: 'talk',
    color: '#06d6a0',
    quotes: [
      '"Caller, you\'re on the air!"',
      '"In 1999, Y2K was EVERYTHING..."',
      '"Tell Dr. Phil I said hi!"',
      '"The fax machine is the future!"',
    ],
  },
  {
    id: 'news',
    frequency: 104.9,
    name: 'NEWS 104',
    label: 'WEATHER / NEWS',
    preset: 5,
    profile: 'news',
    color: '#118ab2',
    quotes: [
      'Sunny with a chance of dial-up...',
      'Traffic: Blocked by a Tamagotchi parade.',
      'Tomorrow: High 72°, low nostalgia.',
    ],
  },
  {
    id: 'future',
    frequency: 107.3,
    name: 'FUTURE FM',
    label: 'FUTURE FM 2026',
    preset: 6,
    profile: 'future',
    color: '#8338ec',
    secret: true,
  },
]

export const FREQ_MIN = 87.5
export const FREQ_MAX = 108.5

/** Find nearest station to a dial frequency. */
export function nearestStation(frequency) {
  return STATIONS.reduce((best, s) => {
    const d = Math.abs(s.frequency - frequency)
    return d < best.dist ? { station: s, dist: d } : best
  }, { station: STATIONS[0], dist: Infinity }).station
}

/** Signal strength 0–1 based on distance from nearest station (0.4 MHz = full lock). */
export function signalStrength(frequency) {
  const { dist } = STATIONS.reduce(
    (best, s) => {
      const d = Math.abs(s.frequency - frequency)
      return d < best.dist ? { dist: d } : best
    },
    { dist: Infinity },
  )
  return Math.max(0, Math.min(1, 1 - dist / 0.45))
}

/** Format frequency for LED display. */
export function formatFrequency(freq) {
  return freq.toFixed(1)
}

export function stationByPreset(num) {
  return STATIONS.find((s) => s.preset === num)
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id)
}
