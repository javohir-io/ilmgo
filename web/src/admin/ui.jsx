import Icon from '../components/Icon'

export function PageHead({ title, subtitle, children }) {
  return (
    <header className="ahead">
      <div><h1 className="ahead__t">{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>
      <div className="ahead__actions">{children}</div>
    </header>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Qidirish…' }) {
  return (
    <label className="inputwrap asearch">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" size={18} />
      <input className="input" type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function Avatar({ name = '', size = 32 }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || '?'
  return <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">{ini}</span>
}
