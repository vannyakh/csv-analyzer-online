/** React Router basename (no trailing slash); undefined = site root. Matches Vite `import.meta.env.BASE_URL`. */
export function routerBasename() {
  const b = import.meta.env.BASE_URL || '/'
  if (b === '/') return undefined
  return b.endsWith('/') ? b.slice(0, -1) : b
}
