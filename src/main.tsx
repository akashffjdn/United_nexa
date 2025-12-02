import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { NetworkProvider } from './contexts/NetworkContext.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx' // 🟢 Import here

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ToastProvider> {/* 🟢 Moved to Top Level */}
      <AuthProvider>
        <NetworkProvider>
          <App />
        </NetworkProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
)