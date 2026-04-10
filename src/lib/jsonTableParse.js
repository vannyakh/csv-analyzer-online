import { normalizeObjectRowsToParsed } from './fieldKeys.js'

export function parseJsonTable(text) {
  const raw = JSON.parse(text)
  if (!Array.isArray(raw)) {
    throw new Error('JSON must be an array of row objects.')
  }
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i]
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`JSON row ${i + 1} must be a plain object, not an array or primitive.`)
    }
  }
  return normalizeObjectRowsToParsed(raw)
}
