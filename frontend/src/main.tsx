import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DesignSystemProvider } from './theme/DesignSystemProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignSystemProvider>
      <App />
    </DesignSystemProvider>
  </StrictMode>,
)
