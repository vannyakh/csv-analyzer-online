import { createBrowserRouter } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { routerBasename } from '@/lib/routerBasename.js'

const App = lazy(() => import('@/App.jsx'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })))
const RouteErrorPage = lazy(() => import('@/pages/RouteErrorPage.jsx').then((m) => ({ default: m.RouteErrorPage })))

function withSuspense(node) {
  return <Suspense fallback={null}>{node}</Suspense>
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: withSuspense(<App />),
      errorElement: withSuspense(<RouteErrorPage />),
    },
    {
      path: '*',
      element: withSuspense(<NotFoundPage />),
      errorElement: withSuspense(<RouteErrorPage />),
    },
  ],
  { basename: routerBasename() },
)
