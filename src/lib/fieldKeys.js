/**
 * Normalize header / object keys: trim and replace whitespace runs with underscores.
 */
export function normalizeFieldKey(key) {
  const s = String(key ?? '').trim().replace(/\s+/g, '_')
  return s || 'column'
}

function buildUniqueFieldNames(originalKeysInOrder) {
  const used = new Set()
  const rename = Object.create(null)
  for (const orig of originalKeysInOrder) {
    let base = normalizeFieldKey(orig)
    let candidate = base
    let i = 2
    while (used.has(candidate)) {
      candidate = `${base}_${i}`
      i += 1
    }
    used.add(candidate)
    rename[orig] = candidate
  }
  return rename
}

/** Normalize keys on Papa-parse-shaped `{ data, meta }` rows. */
export function normalizeParsedObjectKeys(parsed) {
  if (!parsed?.data?.length) return parsed
  const fieldOrder =
    parsed.meta?.fields?.length > 0
      ? [...parsed.meta.fields]
      : Object.keys(parsed.data[0] || {})
  if (fieldOrder.length === 0) return parsed
  const rename = buildUniqueFieldNames(fieldOrder)
  if (fieldOrder.every((f) => rename[f] === f)) return parsed
  const fields = fieldOrder.map((k) => rename[k])
  const data = parsed.data.map((row) => {
    const out = {}
    for (const k of fieldOrder) {
      out[rename[k]] = row[k]
    }
    return out
  })
  return { ...parsed, data, meta: { ...parsed.meta, fields } }
}

/** Build `{ data, meta: { fields } }` from an array of plain objects (e.g. JSON rows). */
export function normalizeObjectRowsToParsed(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { data: [], meta: { fields: [] }, errors: [] }
  }
  const fieldOrder = []
  const seen = new Set()
  for (const row of rows) {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      for (const k of Object.keys(row)) {
        if (!seen.has(k)) {
          seen.add(k)
          fieldOrder.push(k)
        }
      }
    }
  }
  if (fieldOrder.length === 0) {
    return { data: [], meta: { fields: [] }, errors: [] }
  }
  const rename = buildUniqueFieldNames(fieldOrder)
  const fields = fieldOrder.map((k) => rename[k])
  const data = rows
    .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
    .map((row) => {
      const out = {}
      for (const k of fieldOrder) {
        if (Object.prototype.hasOwnProperty.call(row, k)) {
          out[rename[k]] = row[k]
        }
      }
      return out
    })
  return { data, meta: { fields }, errors: [] }
}
