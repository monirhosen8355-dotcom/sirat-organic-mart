import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { initAuthListener } from './store/authStore'
import { initAnalytics } from './lib/analytics/track'
import './index.css'

initAuthListener()
void initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  </StrictMode>
)