const pad = n => String(n).padStart(2, '0')
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const PRESETS = [
  { key: 'today',  label: 'Today' },
  { key: '7d',     label: '7 Days' },
  { key: 'month',  label: 'Month' },
  { key: '3m',     label: '3 Months' },
  { key: '6m',     label: '6 Months' },
  { key: 'year',   label: 'Year' },
  { key: 'all',    label: 'All' },
  { key: 'custom', label: 'Custom' },
]

export const DEFAULT_PRESET = 'month'

export function getRange(key, custom) {
  const now = new Date()
  const today = ymd(now)
  switch (key) {
    case 'today':
      return { from: today, to: today }
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 6)
      return { from: ymd(d), to: today }
    }
    case 'month':
      return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today }
    case '3m': {
      const d = new Date(now); d.setMonth(d.getMonth() - 3)
      return { from: ymd(d), to: today }
    }
    case '6m': {
      const d = new Date(now); d.setMonth(d.getMonth() - 6)
      return { from: ymd(d), to: today }
    }
    case 'year':
      return { from: `${now.getFullYear()}-01-01`, to: today }
    case 'all':
      return { from: null, to: null }
    case 'custom':
      return { from: custom?.from || null, to: custom?.to || null }
    default:
      return { from: null, to: null }
  }
}

export function inRange(date, range) {
  if (!date) return false
  if (range.from && date < range.from) return false
  if (range.to && date > range.to) return false
  return true
}

function formatShort(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function rangeLabel(key, range) {
  if (key === 'custom') {
    if (!range?.from || !range?.to) return 'Custom'
    return `${formatShort(range.from)} – ${formatShort(range.to)}`
  }
  if (key === 'today') return 'Today'
  if (key === '7d') return 'Last 7 days'
  if (key === 'month') {
    const d = new Date()
    return d.toLocaleString('default', { month: 'long', year: 'numeric' })
  }
  if (key === '3m') return 'Last 3 months'
  if (key === '6m') return 'Last 6 months'
  if (key === 'year') return `${new Date().getFullYear()}`
  if (key === 'all') return 'All time'
  return ''
}

// Build chart buckets covering the range, with Income/Expenses tallied per bucket.
// Bucket size auto-picks: ≤31 days → daily, ≤366 days → monthly, otherwise yearly.
export function buildBuckets(range, transactions) {
  let from = range.from
  let to = range.to || ymd(new Date())
  if (!from) {
    from = transactions.reduce((min, t) => (t.date && (!min || t.date < min)) ? t.date : min, null)
  }
  if (!from) return []
  if (from > to) return []

  const fromD = new Date(from + 'T00:00:00')
  const toD = new Date(to + 'T00:00:00')
  const days = Math.round((toD - fromD) / 86400000) + 1

  const mode = days <= 31 ? 'day' : days <= 366 ? 'month' : 'year'
  const buckets = []

  if (mode === 'day') {
    for (let i = 0; i < days; i++) {
      const d = new Date(fromD); d.setDate(fromD.getDate() + i)
      buckets.push({ key: ymd(d), label: d.toLocaleDateString('default', { day: 'numeric', month: 'short' }) })
    }
  } else if (mode === 'month') {
    let d = new Date(fromD.getFullYear(), fromD.getMonth(), 1)
    while (d <= toD) {
      buckets.push({
        key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
        label: d.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
      })
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    }
  } else {
    for (let y = fromD.getFullYear(); y <= toD.getFullYear(); y++) {
      buckets.push({ key: String(y), label: String(y) })
    }
  }

  const lookup = Object.fromEntries(buckets.map(b => [b.key, { ...b, Income: 0, Expenses: 0 }]))
  for (const t of transactions) {
    if (!t.date || !inRange(t.date, { from, to })) continue
    const key = mode === 'day' ? t.date : mode === 'month' ? t.date.slice(0, 7) : t.date.slice(0, 4)
    const bucket = lookup[key]
    if (!bucket) continue
    if (t.type === 'income') bucket.Income += t.amount
    else if (t.type === 'expense') bucket.Expenses += t.amount
  }
  return Object.values(lookup)
}
