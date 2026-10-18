import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../lib/hooks'
import Icon from './Icon'

function Panel({ closing, onClose, title, subtitle, children, footer, width }) {
  const ref = useRef(null)
  const uid = useId()
  useFocusTrap(ref, !closing, onClose)
  return (
    <div className={`overlay overlay--drawer ${closing ? 'is-closing' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside ref={ref} className="drawer glass" style={{ '--drawer-w': `${width}px` }} role="dialog" aria-modal="true" aria-labelledby={`${uid}-t`}>
        <header className="drawer__head">
          <div>
            <h2 id={`${uid}-t`} className="drawer__title">{title}</h2>
            {subtitle && <p className="muted drawer__sub">{subtitle}</p>}
          </div>
          <button type="button" className="btn btn--ghost btn--icon" aria-label="Panelni yopish" onClick={onClose}><Icon name="x" /></button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer && <footer className="drawer__foot">{footer}</footer>}
      </aside>
    </div>
  )
}

/** Focus-trapped slide-over. Stays mounted for the exit animation (exits are faster than entrances). */
export default function Drawer({ open, onClose, title, subtitle, children, footer, width = 520 }) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return undefined }
    if (!mounted) return undefined
    setClosing(true)
    const t = setTimeout(() => { setMounted(false); setClosing(false) }, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  if (!mounted) return null
  return createPortal(
    <Panel closing={closing} onClose={onClose} title={title} subtitle={subtitle} footer={footer} width={width}>{children}</Panel>,
    document.body,
  )
}
