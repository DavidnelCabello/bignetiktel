// Formateo de horas en 12h (AM/PM) para todo el sistema.

// "YYYY-MM-DD HH:MM:SS" (o con T) → "h:MM AM/PM"
export function time12(s) {
  if (!s) return '—'
  const hhmm = s.slice(11, 16)
  const [H, M] = hhmm.split(':').map(Number)
  if (Number.isNaN(H)) return '—'
  const ampm = H >= 12 ? 'PM' : 'AM'
  const h12 = H % 12 || 12
  return `${h12}:${String(M).padStart(2, '0')} ${ampm}`
}

// Sello corto con fecha y hora 12h → "08-15 · 3:20 PM"
export function stamp12(s) {
  if (!s) return ''
  return `${s.slice(5, 10)} · ${time12(s)}`
}
