import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'
import '@/assets/styles/routes.css'
import { AdUnit } from '@/components/AdUnit.jsx'

export function RouteErrorPage() {
  const error = useRouteError()
  let title = 'Something went wrong'
  let message = 'We couldn’t load this page. Please try again in a moment.'
  let code = null

  if (isRouteErrorResponse(error)) {
    code = error.status
    if (error.status === 404) {
      title = 'Page not found'
      message = error.statusText || 'This page does not exist or was moved.'
    } else if (error.status >= 500) {
      title = 'Server error'
      message = error.statusText || 'The server had a problem completing this request.'
    } else {
      title = `Error ${error.status}`
      message = error.statusText || message
    }
  } else if (error instanceof Error) {
    title = 'Something went wrong'
    message = import.meta.env.DEV ? error.message : message
  }

  return (
    <div className="route-shell route-shell--error">
      <div className="route-stack">
        <div className="route-card">
          {code != null ? (
            <p className="route-card__code" aria-hidden>
              {code}
            </p>
          ) : null}
          <h1 className="route-card__title">{title}</h1>
          <p className="route-card__text">{message}</p>
          <div className="route-card__actions">
            <Link to="/" className="route-card__btn">
              Back to CSV Analyzer
            </Link>
            <button type="button" className="route-card__btn route-card__btn--ghost" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </div>
        <AdUnit className="route-ad" />
      </div>
    </div>
  )
}
