import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { RouteErrorPage } from './pages/RouteErrorPage.jsx'
import { routerBasename } from './lib/routerBasename.js'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      errorElement: <RouteErrorPage />,
    },
    {
      path: '*',
      element: <NotFoundPage />,
      errorElement: <RouteErrorPage />,
    },
  ],
  { basename: routerBasename() },
)
