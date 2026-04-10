import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'handsontable/dist/handsontable.full.min.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
