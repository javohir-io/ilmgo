import Icon from './Icon'

export function EmptyState({ icon = 'inbox', title, children, action }) {
  return (
    <div className="state">
      <div className="state__icon"><Icon name={icon} size={26} /></div>
      <h3>{title}</h3>
      {children && <p className="muted" style={{ maxWidth: '42ch' }}>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry, title = 'Nimadir xato ketdi' }) {
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon"><Icon name="alert" size={26} /></div>
      <h3>{title}</h3>
      <p className="muted" style={{ maxWidth: '46ch' }}>{error?.message || 'Iltimos, birozdan keyin qayta urinib koʻring.'}</p>
      {onRetry && <button type="button" className="btn btn--ghost" onClick={onRetry}><Icon name="refresh" size={16} /> Qayta urinish</button>}
    </div>
  )
}

export function Skeleton({ h = 16, w = '100%', r, style, className = '' }) {
  return <div className={`skel ${className}`} style={{ height: h, width: w, borderRadius: r, ...style }} aria-hidden="true" />
}

export function Spinner({ label = 'Yuklanmoqda' }) {
  return <div role="status" aria-label={label} className="spinner" />
}

export function FullSpinner({ label }) {
  return <div className="full-center"><Spinner label={label} /></div>
}
