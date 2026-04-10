/**
 * Pick reasonable default X/Y columns for charting from parsed CSV.
 */
export function suggestChartColumns(parsed) {
  const fields = parsed.meta.fields || Object.keys(parsed.data[0] || {})
  if (fields.length === 0) return { x: '', y: '' }

  const x = fields[0]
  let y = ''

  const rows = parsed.data.slice(0, Math.min(80, parsed.data.length))
  for (const f of fields) {
    if (f === x) continue
    const vals = rows.map((r) => r[f]).filter((v) => v !== null && v !== undefined && v !== '')
    if (vals.length === 0) continue
    const numeric = vals.filter((v) => !Number.isNaN(parseFloat(v))).length
    if (numeric / vals.length >= 0.45) {
      y = f
      break
    }
  }

  if (!y) {
    y = fields.find((f) => f !== x) || ''
  }

  return { x, y }
}
