import '../styles/pages.css'
import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import JobCard from '../components/JobCard'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import { fetchJobs, fetchMeta } from '../lib/jobsData'
import { gsap, Flip } from '../lib/gsap'
import { useDebounced, useFetch } from '../lib/hooks'
import { useMeta } from '../lib/meta'
import { staggerIn } from '../lib/motion'
import { useState } from 'react'
import { LEVEL_LABEL, TYPE_LABEL, WORK_MODE_LABEL, label as tr } from '../lib/i18n'

const SORTS = [['recent', 'Eng yangilari'], ['deadline', 'Muddati yaqinlari']]

function Filter({ label, value, options, onChange, names = {} }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Hammasi</option>
        {options.map((o) => <option key={o} value={o}>{tr(names, o)}</option>)}
      </select>
    </label>
  )
}

export default function Jobs() {
  useMeta({ title: 'Ochiq vakansiyalar', description: 'Talabalar uchun stajirovka, co-op va yarim stavkali vakansiyalarni koʻring.' })
  const [sp, setSp] = useSearchParams()
  const q = {
    search: sp.get('q') || '', type: sp.get('type') || '', workMode: sp.get('mode') || '',
    level: sp.get('level') || '', skill: sp.get('skill') || '', sort: sp.get('sort') || 'recent',
  }
  const [text, setText] = useState(q.search)
  const debounced = useDebounced(text, 350)
  const set = (k, v) => setSp((prev) => { const n = new URLSearchParams(prev); v ? n.set(k, v) : n.delete(k); return n }, { replace: true })
  useEffect(() => { if (debounced !== q.search) set('q', debounced) /* eslint-disable-next-line */ }, [debounced])

  const meta = useFetch((signal) => fetchMeta(signal), [])
  const { data, error, loading, reload } = useFetch(
    (signal) => fetchJobs({ search: q.search, type: q.type, workMode: q.workMode, level: q.level, skill: q.skill, sort: q.sort }, signal),
    [q.search, q.type, q.workMode, q.level, q.skill, q.sort],
  )
  const grid = useRef(null)
  const prevRects = useRef(null)

  // Animate the list: Flip existing cards into their new positions, stagger first paint.
  useEffect(() => {
    if (!grid.current || !data) return
    if (prevRects.current?.state) {
      const items = grid.current.children
      Flip.from(prevRects.current.state, { targets: items, duration: 0.5, ease: 'power3.out', absolute: false, nested: false, onEnter: (els) => gsap.from(els, { autoAlpha: 0, y: 14, duration: 0.5 }) })
    } else staggerIn(grid.current)
    prevRects.current = null
  }, [data])
  const remember = () => { if (grid.current) prevRects.current = { state: Flip.getState(grid.current.children) } }

  const m = meta.data || { types: [], workModes: [], levels: [], skills: [] }
  const jobs = data?.jobs || []
  const active = useMemo(() => Object.entries({ type: q.type, mode: q.workMode, level: q.level, skill: q.skill }).filter(([, v]) => v), [q.type, q.workMode, q.level, q.skill])

  return (
    <div className="container page">
      <header className="page__head">
        <p className="eyebrow">Ochiq vakansiyalar</p>
        <h1 className="h-section">Keyingi <span className="grad-text">parvozingizni</span> toping.</h1>
        {data?.demo && <p className="note glass"><Icon name="alert" size={16} /> Demo maʼlumotlar koʻrsatilmoqda — jonli vakansiyalarni koʻrish uchun backendni ishga tushiring.</p>}
      </header>

      <section className="filters glass glass--lg" aria-label="Filtrlar" onChange={remember}>
        <label className="field filters__search">
          <span className="field__label">Qidiruv</span>
          <span className="inputwrap"><Icon name="search" size={18} /><input className="input" type="search" placeholder="Lavozim, kompaniya, shahar yoki koʻnikma" value={text} onChange={(e) => setText(e.target.value)} /></span>
        </label>
        <Filter label="Turi" names={TYPE_LABEL} value={q.type} options={m.types} onChange={(v) => { remember(); set('type', v) }} />
        <Filter label="Ish formati" names={WORK_MODE_LABEL} value={q.workMode} options={m.workModes} onChange={(v) => { remember(); set('mode', v) }} />
        <Filter label="Daraja" names={LEVEL_LABEL} value={q.level} options={m.levels} onChange={(v) => { remember(); set('level', v) }} />
        <label className="field">
          <span className="field__label">Saralash</span>
          <select className="select" value={q.sort} onChange={(e) => { remember(); set('sort', e.target.value) }}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
      </section>

      {m.skills.length > 0 && (
        <div className="skillbar" role="group" aria-label="Koʻnikma boʻyicha filtr">
          {m.skills.slice(0, 14).map((s) => (
            <button key={s.name} type="button" className="chip" aria-pressed={q.skill === s.name} onClick={() => { remember(); set('skill', q.skill === s.name ? '' : s.name) }}>{s.name}</button>
          ))}
        </div>
      )}

      <p className="count muted" aria-live="polite">
        {loading ? 'Yuklanmoqda…' : `${jobs.length} ta vakansiya`}
        {active.length > 0 && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSp(new URLSearchParams(q.search ? { q: q.search } : {}))}>Filtrlarni tozalash</button>}
      </p>

      {error && !data ? <ErrorState error={error} onRetry={reload} />
        : loading && !data ? (<div className="grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={196} r="var(--r-md)" />)}</div>)
          : jobs.length === 0 ? <EmptyState icon="search" title="Mos vakansiya topilmadi" action={<button type="button" className="btn btn--ghost" onClick={() => setSp(new URLSearchParams())}>Filtrlarni tiklash</button>}>Filtrlardan birini olib tashlang yoki kengroq soʻz bilan qidiring.</EmptyState>
            : <div ref={grid} className="grid">{jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>}
    </div>
  )
}
