/**
 * Handsontable 12+ exposes the Search API via getPlugin('search'), not hot.search.
 */
export function applyHandsontableSearch(hot, query) {
  if (!hot) return
  const searchPlugin = hot.getPlugin?.('search')
  if (!searchPlugin || typeof searchPlugin.query !== 'function') return
  const q = query.trim().toLowerCase()
  searchPlugin.query(q)
  hot.render()
}
