import { useMemo, useState } from 'react'
import Drawer from '../components/Drawer'
import Icon from '../components/Icon'
import { Monogram } from '../components/JobCard'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import StatusPill from '../components/StatusPill'
import { useToast } from '../components/Toast'
import { api, assetUrl } from '../lib/api'
import { fmtDateTime, fmtShort, timeAgo } from '../lib/format'
import { useDebounced, useFetch } from '../lib/hooks'
import { SKILL_LEVEL_LABEL, STATUS_LABEL, label } from '../lib/i18n'
import { Avatar, PageHead, SearchBox } from './ui'

const COLS = ['submitted', 'reviewing', 'interview', 'offer', 'rejected']
const ALL = [...COLS, 'withdrawn']

function Card({ a, onOpen, onDragStart }) {
  return (
    <article className="kcard glass" draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(a.id) }} onDragEnd={() => onDragStart(null)}>
      <button type="button" className="kcard__btn" onClick={() => onOpen(a)} aria-label={`Arizani ochish: ${a.firstName} ${a.lastName}, ${a.job?.title}`}>
        <span className="kcard__top"><Avatar name={`${a.firstName} ${a.lastName}`} size={30} /><b>{a.firstName} {a.lastName}</b><Icon name="grip" size={16} className="faint" /></span>
        <span className="kcard__job"><Monogram job={a.job || {}} size={20} /> <span className="muted">{a.job?.title}</span></span>
        <small className="faint">{label(SKILL_LEVEL_LABEL, a.skillLevel)} · {timeAgo(a.createdAt)}</small>
      </button>
    </article>
  )
}

function Detail({ a, onClose, onMove }) {
  const [status, setStatus] = useState(a.status)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async () => { setBusy(true); await onMove(a.id, status, note); setBusy(false); setNote('') }
  return (
    <div className="adetail">
      <div className="adetail__who"><Avatar name={`${a.firstName} ${a.lastName}`} size={48} /><div><b>{a.firstName} {a.lastName}</b><p className="muted">{a.email} · {a.phone}</p><p className="faint">{[a.city, a.university].filter(Boolean).join(' · ')}</p></div></div>
      <dl className="kv">
        <div><dt>Lavozim</dt><dd>{a.job?.title} · {a.job?.company}</dd></div>
        <div><dt>Daraja</dt><dd>{label(SKILL_LEVEL_LABEL, a.skillLevel)}</dd></div>
        <div><dt>Ariza sanasi</dt><dd>{fmtDateTime(a.createdAt)}</dd></div>
        <div><dt>Rezyume</dt><dd><a className="alink" href={assetUrl(a.resumeUrl)} target="_blank" rel="noreferrer">{a.resumeOriginalName} <Icon name="external" size={14} /></a></dd></div>
      </dl>
      {a.coverNote && <section><h3 className="sub">Hamrohlik xati</h3><p className="muted pre">{a.coverNote}</p></section>}
      <section className="field"><h3 className="sub">Holatni yangilash</h3>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Holat">{ALL.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <textarea className="textarea" placeholder="Talaba bilan ulashiladigan izoh (ixtiyoriy)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="button" className="btn btn--primary" disabled={busy || status === a.status} onClick={save}>{busy ? 'Saqlanmoqda…' : 'Yangilash va talabaga xabar berish'}</button></section>
      <section><h3 className="sub">Tarix</h3>
        <ol className="tl">{(a.events || []).map((e, i) => <li key={i}><StatusPill status={e.status} /><span className="muted">{e.note || '—'}</span><small className="faint">{fmtDateTime(e.createdAt)}</small></li>)}</ol></section>
      <button type="button" className="btn btn--ghost" onClick={onClose}>Yopish</button>
    </div>
  )
}

export default function Applications() {
  const toast = useToast()
  const [view, setView] = useState('board')
  const [q, setQ] = useState('')
  const [jobId, setJobId] = useState('')
  const dq = useDebounced(q, 300)
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const [open, setOpen] = useState(null)
  const jobs = useFetch((signal) => api('/api/jobs', { query: { status: 'all' }, signal }), [])
  const { data, error, loading, reload, setData } = useFetch((signal) => api('/api/admin/applications', { query: { q: dq, jobId }, signal }), [dq, jobId])
  const apps = data?.applications || []
  const by = useMemo(() => Object.fromEntries(ALL.map((s) => [s, apps.filter((a) => a.status === s)])), [apps])
  const current = open && apps.find((a) => a.id === open) // keep the drawer in sync after a move

  const move = async (id, status, note = '') => {
    const a = apps.find((x) => x.id === id)
    if (!a || a.status === status) return
    const prev = data
    setData((d) => ({ ...d, applications: d.applications.map((x) => (x.id === id ? { ...x, status, events: [...(x.events || []), { status, note, createdAt: new Date().toISOString() }] } : x)) }))
    try {
      const { application } = await api(`/api/admin/applications/${id}`, { method: 'PATCH', body: { status, note: note || undefined } })
      setData((d) => ({ ...d, applications: d.applications.map((x) => (x.id === id ? { ...x, ...application } : x)) }))
      toast.success(`Holat oʻzgartirildi: ${STATUS_LABEL[status]}`)
    } catch (e) { setData(prev); toast.error(e.message) }
  }

  const exportCsv = async () => {
    try {
      const res = await api('/api/admin/applications.csv', { raw: true })
      const url = URL.createObjectURL(await res.blob())
      const el = Object.assign(document.createElement('a'), { href: url, download: 'arizalar.csv' })
      document.body.appendChild(el); el.click(); el.remove(); URL.revokeObjectURL(url)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <>
      <PageHead title="Arizalar" subtitle="Talabani bosqichlar boʻylab siljitish uchun kartani ustunlar orasida suring.">
        <SearchBox value={q} onChange={setQ} placeholder="Talaba yoki lavozim qidirish" />
        <select className="select asel" value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Vakansiya boʻyicha filtr"><option value="">Barcha vakansiyalar</option>{(jobs.data?.jobs || []).map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
        <div className="seg" role="group" aria-label="Koʻrinish"><button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}><Icon name="kanban" size={16} /> Doska</button><button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}><Icon name="list" size={16} /> Jadval</button></div>
        <button type="button" className="btn btn--ghost" onClick={exportCsv}><Icon name="download" size={16} /> CSV</button>
      </PageHead>

      {error && !data ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton h={360} r="var(--r-md)" /> : apps.length === 0 ? <EmptyState icon="kanban" title="Arizalar topilmadi">Talabalar ilova orqali ariza yuborganda ular shu yerda paydo boʻladi.</EmptyState> : view === 'board' ? (
        <>
          <div className="board">
            {COLS.map((s) => (
              <section key={s} className={`col ${over === s ? 'is-over' : ''}`} style={{ '--c': `var(--st-${s})` }} aria-label={`${STATUS_LABEL[s]}, ${by[s].length} ta ariza`}
                onDragOver={(e) => { if (drag) { e.preventDefault(); setOver(s) } }} onDragLeave={() => setOver((o) => (o === s ? null : o))}
                onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain') || drag; setDrag(null); move(id, s) }}>
                <h2 className="col__h"><i /> {STATUS_LABEL[s]} <span className="faint num">{by[s].length}</span></h2>
                <div className="col__list">{by[s].map((a) => <Card key={a.id} a={a} onOpen={(x) => setOpen(x.id)} onDragStart={setDrag} />)}</div>
              </section>
            ))}
          </div>
          {by.withdrawn.length > 0 && <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>Bekor qilingan {by.withdrawn.length} ta ariza jadval koʻrinishida koʻrinadi.</p>}
        </>
      ) : (
        <div className="tablewrap glass"><table className="table">
          <thead><tr><th>Talaba</th><th>Lavozim</th><th>Holat</th><th>Sana</th></tr></thead>
          <tbody>{apps.map((a) => (<tr key={a.id} className="clickable" tabIndex={0} onClick={() => setOpen(a.id)} onKeyDown={(e) => e.key === 'Enter' && setOpen(a.id)}>
            <td><div className="cell"><Avatar name={`${a.firstName} ${a.lastName}`} /><span><b>{a.firstName} {a.lastName}</b><br /><small className="muted">{a.email}</small></span></div></td>
            <td className="muted">{a.job?.title}<br /><small className="faint">{a.job?.company}</small></td><td><StatusPill status={a.status} /></td><td className="muted">{fmtShort(a.createdAt)}</td></tr>))}</tbody></table></div>
      )}
      <Drawer open={!!current} onClose={() => setOpen(null)} title={current ? `${current.firstName} ${current.lastName}` : ''} subtitle={current?.job?.title} width={520}>
        {current && <Detail key={current.id + current.status} a={current} onClose={() => setOpen(null)} onMove={move} />}
      </Drawer>
    </>
  )
}
