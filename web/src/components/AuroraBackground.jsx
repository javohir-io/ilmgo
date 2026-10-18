import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { hasWebGL, isLowPower, isVeryLowPower, useReducedMotion } from '../lib/env'
import ErrorBoundary from './ErrorBoundary'

const ShaderLayer = lazy(() => import('../three/ShaderLayer'))

/**
 * Fixed aurora. The CSS blobs paint immediately and are the permanent fallback; the ShaderGradient
 * layer is lazy-loaded after idle and fades in on top. Weak devices / no WebGL / failures keep the CSS only.
 */
export default function AuroraBackground({ variant = 'auto' }) {
  const [gl, setGl] = useState(false)
  const [ready, setReady] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (variant === 'css' || isVeryLowPower() || !hasWebGL()) return undefined
    const start = () => setGl(true)
    if (window.requestIdleCallback) {
      const h = window.requestIdleCallback(start, { timeout: 1500 })
      return () => window.cancelIdleCallback?.(h)
    }
    const t = setTimeout(start, 400)
    return () => clearTimeout(t)
  }, [variant])

  const onReady = useCallback(() => setReady(true), [])

  return (
    <div className="page-bg" aria-hidden="true">
      <div className="page-bg__blobs">
        <i className="blob blob--a" />
        <i className="blob blob--b" />
        <i className="blob blob--c" />
      </div>
      {gl && (
        <div className={`page-bg__gl ${ready ? 'is-ready' : ''}`}>
          <ErrorBoundary label="aurora background" fallback={null} onError={() => setGl(false)}>
            <Suspense fallback={null}>
              <ShaderLayer reduced={reduced} lowPower={isLowPower()} onReady={onReady} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
      <div className="page-bg__scrim" />
    </div>
  )
}
