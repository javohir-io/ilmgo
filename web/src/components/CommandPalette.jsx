import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useFocusTrap } from '../lib/hooks'
import { PALETTE_EVENT } from '../lib/palette'
import Icon from './Icon'

function Palette({ onClose }) {
  const nav = useNavigate()
  const { isAdmin, logout } = useAuth()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const listRef = useRef(null)
  useFocusTrap(ref, true, onClose)

  const all = useMemo(() => {
    const go = (to) => () => nav(to)
    const base = [
      { id: 'home', label: 'Bosh sahifa', group: 'Oʻtish', icon: 'home', run: go('/') },
      { id: 'jobs', label: 'Vakansiyalarni koʻrish', group: 'Oʻtish', icon: 'briefcase', run: go('/jobs') },
      { id: 'how', label: 'Qanday ishlaydi', group: 'Oʻtish', icon: 'sparkle', run: go({ pathname: '/', hash: '#how' }) },
      { id: 'features', label: 'Imkoniyatlar', group: 'Oʻtish', icon: 'grid', run: go({ pathname: '/', hash: '#features' }) },
      { id: 'app', label: 'Ilovani yuklash', group: 'Oʻtish', icon: 'phone', run: go({ pathname: '/', hash: '#app' }) },
      { id: 'admin', label: 'Admin paneli', group: 'Admin', icon: 'chart', run: go('/admin') },
    ]
    if (!isAdmin) return base
    return [
      ...base,
      { id: 'a-jobs', label: 'Admin: Vakansiyalar', group: 'Admin', icon: 'briefcase', run: go('/admin/jobs') },
      { id: 'a-apps', label: 'Admin: Arizalar', group: 'Admin', icon: 'kanban', run: go('/admin/applications') },
      { id: 'a-int', label: 'Admin: Intervyular', group: 'Admin', icon: 'calendar', run: go('/admin/interviews') },
      { id: 'a-stu', label: 'Admin: Talabalar', group: 'Admin', icon: 'users', run: go('/admin/students') },
      { id: 'out', label: 'Chiqish', group: 'Hisob', icon: 'logout', run: () => { logout(); nav('/') } },
    ]
  }, [nav, isAdmin, logout])

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const hit = needle ? all.filter((c) => c.label.toLowerCase().includes(needle)) : all
    if (!needle) return hit
    return [...hit, { id: 'search', label: `“${q.trim()}” boʻyicha vakansiya qidirish`, group: 'Qidiruv', icon: 'search', run: () => nav({ pathname: '/jobs', search: `?q=${encodeURIComponent(q.trim())}` }) }]
  }, [all, q, nav])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [active])

  const run = (item) => { if (!item) return; onClose(); item.run() }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % Math.max(1, items.length)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + items.length) % Math.max(1, items.length)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(items[active]) }
  }

  return createPortal(
    <div className="overlay overlay--palette" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className="palette glass glass--lg" role="dialog" aria-modal="true" aria-label="Buyruqlar paneli">
        <div className="palette__input">
          <Icon name="search" size={18} />
          <input
            data-autofocus className="palette__field" placeholder="Buyruq yozing yoki vakansiya qidiring…" value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={items[active] ? `pal-${items[active].id}` : undefined} aria-label="Buyruq"
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <ul id="palette-list" ref={listRef} className="palette__list" role="listbox" aria-label="Buyruqlar">
          {items.map((it, i) => (
            <li key={it.id} id={`pal-${it.id}`} role="option" aria-selected={i === active} className="palette__item" onMouseMove={() => setActive(i)} onClick={() => run(it)}>
              <Icon name={it.icon} size={18} />
              <span>{it.label}</span>
              <span className="faint palette__group">{it.group}</span>
            </li>
          ))}
          {!items.length && <li className="palette__empty muted">Hech narsa topilmadi</li>}
        </ul>
      </div>
    </div>,
    document.body,
  )
}

/** Ctrl/Cmd+K anywhere (or openPalette()). */
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(PALETTE_EVENT, onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(PALETTE_EVENT, onOpen) }
  }, [])
  return open ? <Palette onClose={() => setOpen(false)} /> : null
}
