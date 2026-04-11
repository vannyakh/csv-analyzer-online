import { Link } from 'react-router-dom'
import '@/assets/styles/routes.css'
import { AdUnit } from '@/components/AdUnit.jsx'

export function NotFoundPage() {
  return (
    <div className="route-shell route-shell--notfound">
      <div className="route-stack">
        <div className="route-card">
          <p className="route-card__code" aria-hidden>
            404
          </p>
          <h1 className="route-card__title">Page not found</h1>
          <p className="route-card__text">The address may be wrong or the page was removed.</p>
          <Link to="/" className="route-card__btn">
            Back to CSV Analyzer
          </Link>
        </div>
        <AdUnit className="route-ad" />
      </div>
    </div>
  )
}
