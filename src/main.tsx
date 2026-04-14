import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import '@fontsource-variable/inter/index.css'
import './index.css'

const FAVICON_PATH = '/favicon-paw.svg'

function ensureFavicon(): void {
  const selectors = [
    "link[rel='icon']",
    "link[rel='shortcut icon']",
    "link[rel='apple-touch-icon']",
  ]

  selectors.forEach((selector) => {
    let link = document.head.querySelector<HTMLLinkElement>(selector)
    if (!link) {
      link = document.createElement('link')
      if (selector.includes('shortcut')) link.rel = 'shortcut icon'
      else if (selector.includes('apple-touch')) link.rel = 'apple-touch-icon'
      else link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = FAVICON_PATH
    if (link.rel === 'icon' || link.rel === 'shortcut icon') {
      link.type = 'image/svg+xml'
    }
  })
}

ensureFavicon()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
