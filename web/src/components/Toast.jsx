import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import Icon from './Icon'

const Ctx = createContext(null)
const NOOP = { push() {}, dismiss() {}, success() {}, error() {}, info() {} }
export const useToast = () => useContext(Ctx) || NOOP

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback((message, { kind = 'info', duration = 4200, action } = {}) => {
    const id = ++idRef.current
    setItems((l) => [...l.slice(-3), { id, message, kind, action }])
    if (duration) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const value = useMemo(() => ({
    push,
    dismiss,
    info: (m, o) => push(m, { ...o, kind: 'info' }),
    success: (m, o) => push(m, { ...o, kind: 'success' }),
    error: (m, o) => push(m, { duration: 7000, ...o, kind: 'error' }),
  }), [push, dismiss])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="region" aria-label="Bildirishnomalar" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind} glass`} role={t.kind === 'error' ? 'alert' : 'status'}>
            <span className="toast__icon"><Icon name={t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'bell'} size={18} /></span>
            <span className="toast__msg">{t.message}</span>
            {t.action && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { t.action.onClick(); dismiss(t.id) }}>{t.action.label}</button>
            )}
            <button type="button" className="toast__close" aria-label="Bildirishnomani yopish" onClick={() => dismiss(t.id)}><Icon name="x" size={16} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
