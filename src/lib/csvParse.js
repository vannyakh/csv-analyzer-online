import Papa from 'papaparse'

export function parseCsvText(csv) {
  return Papa.parse(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })
}
