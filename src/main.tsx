import React, { useEffect } from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { SiteDataProvider } from './context/SiteDataContext.tsx'
import './index.css'

function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const elementsObserved = new WeakSet<Element>()

    const showImmediately = () => {
      document.querySelectorAll<HTMLElement>('.reveal-on-scroll').forEach((el) => el.classList.add('is-visible'))
    }

    if (!('IntersectionObserver' in window)) {
      showImmediately()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          } else {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    const observeNewElements = () => {
      document.querySelectorAll<HTMLElement>('.reveal-on-scroll').forEach((el) => {
        if (!elementsObserved.has(el)) {
          observer.observe(el)
          elementsObserved.add(el)
        }
      })
    }

    observeNewElements()

    const mutationObserver = new MutationObserver(() => {
      observeNewElements()
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SiteDataProvider>
        <ScrollRevealProvider>
          <App />
        </ScrollRevealProvider>
      </SiteDataProvider>
    </BrowserRouter>
  </StrictMode>,
)
