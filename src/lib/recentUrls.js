const STORAGE_KEY = 'csv-analyzer-recent-urls'
const MAX = 5

export function getRecentUrls() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter((u) => typeof u === 'string' && u.startsWith('http')) : []
  } catch {
    return []
  }
}

export function rememberUrl(url) {
  try {
    const trimmed = url.trim()
    if (!trimmed.startsWith('http')) return
    const next = [trimmed, ...getRecentUrls().filter((u) => u !== trimmed)].slice(0, MAX)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
}
