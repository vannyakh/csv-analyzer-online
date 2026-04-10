/**
 * Assigns CSS classes per column so we can style IDs, emails, dates, etc. differently.
 */
export function handsontableCells(row, col, prop) {
  const key = String(prop ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim()

  const classes = ['ht-cell']

  if (/\b(uuid|guid)\b/.test(key) || /\bid\b/.test(key) || key.endsWith(' id') || key === 'id') {
    classes.push('ht-cell--id')
  } else if (key.includes('email') || key.includes('e mail')) {
    classes.push('ht-cell--email')
  } else if (
    key.includes('phone') ||
    key.includes('tel') ||
    key.includes('mobile') ||
    key.includes('fax')
  ) {
    classes.push('ht-cell--phone')
  } else if (
    key.includes('date') ||
    key.includes('time') ||
    key.includes('created') ||
    key.includes('updated') ||
    key.includes('subscription')
  ) {
    classes.push('ht-cell--date')
  } else if (key.includes('url') || key.includes('website') || key.includes('link') || key.includes('http')) {
    classes.push('ht-cell--url')
  } else if (
    /\b(qty|quantity|amount|price|total|sum|balance|count|number|num)\b/.test(key) ||
    /^[\d.]+%?$/.test(key)
  ) {
    classes.push('ht-cell--num')
  } else {
    classes.push('ht-cell--text')
  }

  return { className: classes.join(' ') }
}
