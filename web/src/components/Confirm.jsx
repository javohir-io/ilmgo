import { createContext, useCallback, useContext, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../lib/hooks'

const Ctx = createContext(null)
/** const confirm = useConfirm(); if (await confirm({ title, body, confirmLabel, danger })) ... */
export const useConfirm = () => useContext(Ctx) || (() => Promise.resolve(window.confirm('Are you sure?')))

function Dialog({ req, onDone }) {
  const ref = useRef(null)
  const uid = useId()
  useFocusTrap(ref, true, () => onDone(false))
  return createPortal(
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onDone(false) }}>
      <div ref={ref} className="dialog glass glass--lg" role="alertdialog" aria-modal="true" aria-labelledby={`${uid}-t`} aria-describedby={`${uid}-d`}>
        <h2 id={`${uid}-t`} className="dialog__title">{req.title || 'Are you sure?'}</h2>
        <p id={`${uid}-d`} className="muted">{req.body}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" data-autofocus onClick={() => onDone(false)}>{req.cancelLabel || 'Bekor qilish'}</button>
          <button type="button" className={`btn ${req.danger ? 'btn--danger' : 'btn--primary'}`} onClick={() => onDone(true)}>{req.confirmLabel || 'Tasdiqlash'}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null)
  const confirm = useCallback((opts) => new Promise((resolve) => setReq({ ...opts, resolve })), [])
  const done = useCallback((value) => {
    setReq((r) => { r?.resolve(value); return null })
  }, [])
  const value = useMemo(() => confirm, [confirm])
  return (
    <Ctx.Provider value={value}>
      {children}
      {req && <Dialog req={req} onDone={done} />}
    </Ctx.Provider>
  )
}
