import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

// A prerendered page is hydrated; an empty one is rendered from scratch. The
// second branch keeps `npm run dev` working, where there is no prerender step.
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, tree)
} else {
  createRoot(rootElement).render(tree)
}
