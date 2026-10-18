import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/Confirm'
import CommandPalette from './components/CommandPalette'
import NoiseOverlay from './components/NoiseOverlay'
import PublicLayout from './components/PublicLayout'
import { FullSpinner } from './components/States'

const Landing = lazy(() => import('./pages/Landing'))
const Jobs = lazy(() => import('./pages/Jobs'))
const JobDetail = lazy(() => import('./pages/JobDetail'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminApp = lazy(() => import('./admin/AdminApp'))

function Crash() {
  return (
    <div className="full-center" role="alert">
      <div className="state">
        <h2>Ilmgo hit a snag</h2>
        <p className="muted">Reload the page to try again.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary label="app" fallback={<Crash />}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <a className="skip-link" href="#main">Skip to content</a>
              <Suspense fallback={<FullSpinner label="Sahifa yuklanmoqda" />}>
                <Routes>
                  <Route element={<PublicLayout />}>
                    <Route index element={<Landing />} />
                    <Route path="jobs" element={<Jobs />} />
                    <Route path="jobs/:id" element={<JobDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  <Route path="admin/*" element={<AdminApp />} />
                </Routes>
              </Suspense>
              <CommandPalette />
              <NoiseOverlay />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
