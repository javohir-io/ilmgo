import { MONTHS_SHORT, WEEKDAYS_SHORT } from './i18n'

const DAY = 86400000

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || '?'

const parse = (iso) => {
  const d = new Date(iso && iso.length === 10 ? `${iso}T00:00:00` : iso)
  return Number.isNaN(d.getTime()) ? null : d
}
const two = (n) => String(n).padStart(2, '0')

/** "3-noy, 2026" (opts.year false drops the year). */
export function fmtDate(iso, { year = true } = {}) {
  const d = iso ? parse(iso) : null
  if (!d) return '—'
  return `${d.getDate()}-${MONTHS_SHORT[d.getMonth()]}${year ? `, ${d.getFullYear()}` : ''}`
}
export const fmtDay = (iso) => {
  const d = iso ? parse(iso) : null
  return d ? `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()}-${MONTHS_SHORT[d.getMonth()]}` : '—'
}
export const fmtShort = (iso) => fmtDate(iso, { year: false })
export function fmtDateTime(iso) {
  const d = iso ? parse(iso) : null
  return d ? `${d.getDate()}-${MONTHS_SHORT[d.getMonth()]}, ${two(d.getHours())}:${two(d.getMinutes())}` : '—'
}
export function timeAgo(iso) {
  const t = new Date(iso).getTime()
  if (!t) return ''
  const s = Math.max(0, (Date.now() - t) / 1000)
  if (s < 60) return 'hozirgina'
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} kun oldin`
  return fmtDate(iso)
}
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function endTime(time, mins = 30) {
  const [h, m] = (time || '00:00').split(':').map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
export function countdown(iso, now = Date.now()) {
  if (!iso) return null
  const ms = new Date(iso).getTime() - now
  if (Number.isNaN(ms)) return null
  if (ms <= 0) return { over: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    over: false,
    days: Math.floor(ms / DAY),
    hours: Math.floor((ms % DAY) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
  }
}
export const isoToDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')
export const dateInputToISO = (v) => (v ? new Date(`${v}T23:59:00`).toISOString() : null)
export const monogram = (company = '') => (company.trim()[0] || '?').toUpperCase()
/** Uzbek nouns stay singular after a number: "3 ariza". */
export const plural = (n, one) => `${n} ${one}`
