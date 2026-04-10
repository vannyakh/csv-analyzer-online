import Papa from 'papaparse'
import { normalizeParsedObjectKeys } from './fieldKeys.js'

export function parseCsvText(csv) {
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })
  return normalizeParsedObjectKeys(parsed)
}
