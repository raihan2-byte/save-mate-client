export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

// Floor to nearest 500 (by absolute value). Handles negative values.
// 10.100 → 10rb, 10.700 → 10.5rb, -18.613 → -18.5rb
export function formatCurrencyShort(val: number): string {
  const sign = val < 0 ? '-' : ''
  const abs = Math.abs(val)
  if (abs >= 1_000_000) {
    const floored = Math.floor(abs / 500_000) * 500_000
    const jt = floored / 1_000_000
    return sign + 'Rp ' + (jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)) + 'jt'
  }
  if (abs >= 1_000) {
    const floored = Math.floor(abs / 500) * 500
    const rb = floored / 1_000
    return sign + 'Rp ' + (rb % 1 === 0 ? rb.toFixed(0) : rb.toFixed(1)) + 'rb'
  }
  return sign + 'Rp ' + Math.floor(abs)
}

export function formatRupiah(val: number): string {
  return 'Rp ' + Math.round(Math.abs(val)).toLocaleString('id-ID')
}

export function toLocaleDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return toLocaleDateStr(new Date(y, m - 1, d + days))
}
