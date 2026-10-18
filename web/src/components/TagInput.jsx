import { useState } from 'react'
import Icon from './Icon'

/** Type, press Enter or comma to add; Backspace on an empty field removes the last tag. */
export default function TagInput({ id, value = [], onChange, placeholder = 'Yozing va Enter bosing', max = 30, 'aria-describedby': describedBy }) {
  const [draft, setDraft] = useState('')
  const add = (raw) => {
    const t = raw.trim()
    if (!t || value.some((v) => v.toLowerCase() === t.toLowerCase()) || value.length >= max) { setDraft(''); return }
    onChange([...value, t])
    setDraft('')
  }
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft) }
    else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <div className="taginput">
      {value.map((t) => (
        <span key={t} className="chip taginput__tag">
          {t}
          <button type="button" aria-label={`${t} ni olib tashlash`} onClick={() => onChange(value.filter((v) => v !== t))}><Icon name="x" size={12} /></button>
        </span>
      ))}
      <input
        id={id} className="taginput__input" value={draft} placeholder={value.length ? '' : placeholder}
        onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={() => add(draft)} aria-describedby={describedBy}
      />
    </div>
  )
}
