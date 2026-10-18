import { useEffect, useMemo, useState } from 'react'
import Drawer from '../components/Drawer'
import Icon from '../components/Icon'
import { Monogram } from '../components/JobCard'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import TagInput from '../components/TagInput'
import { useConfirm } from '../components/Confirm'
import { useToast } from '../components/Toast'
import { api, assetUrl } from '../lib/api'
import { dateInputToISO, fmtShort, isoToDateInput } from '../lib/format'
import { useFetch } from '../lib/hooks'
import { LEVEL_LABEL, TYPE_LABEL, WORK_MODE_LABEL, label as tr } from '../lib/i18n'
import { ACCENT_SWATCHES } from '../lib/tokens'
import { PageHead, SearchBox } from './ui'

const TYPES = ['Internship', 'Part-time', 'Full-time', 'Co-op']
const MODES = ['Remote', 'Hybrid', 'On-site']
const LEVELS = ['Entry', 'Junior', 'Mid']
const EMPTY = { title: '', company: '', location: '', type: 'Internship', workMode: 'Hybrid', level: 'Entry', stipend: '', deadline: '', status: 'open', featured: false, accent: ACCENT_SWATCHES[0], skills: [], requirements: [], benefits: [], description: '', companyAbout: '' }

function JobForm({ job, onClose, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { setF(job ? { ...EMPTY, ...job, deadline: isoToDateInput(job.deadline), stipend: job.stipend || '' } : EMPTY); setFile(null); setErrors({}) }, [job])
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v && v.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }))

  const submit = async (e) => {
    e.preventDefault()
    const err = {}
    ;['title', 'company', 'location', 'description'].forEach((k) => { if (!String(f[k]).trim()) err[k] = 'Majburiy maydon' })
    setErrors(err)
    if (Object.keys(err).length) return
    setBusy(true)
    try {
      const body = { ...f, deadline: dateInputToISO(f.deadline) }
      delete body.id; delete body.createdAt; delete body.imageUrl
      let saved = (await (job ? api(`/api/jobs/${job.id}`, { method: 'PUT', body }) : api('/api/jobs', { method: 'POST', body }))).job
      if (file) { const form = new FormData(); form.append('image', file); saved = (await api(`/api/jobs/${saved.id}/image`, { method: 'POST', form })).job }
      toast.success(job ? 'Vakansiya yangilandi' : 'Vakansiya yaratildi')
      onSaved(saved)
    } catch (ex) { toast.error(ex.message) } finally { setBusy(false) }
  }

  const text = (k, label, props = {}) => (
    <label className="field"><span className="field__label">{label}</span>
      <input className="input" value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      <span className="field__error" role="alert">{errors[k]}</span></label>
  )
  const select = (k, label, opts, map = {}) => (<label className="field"><span className="field__label">{label}</span><select className="select" value={f[k]} onChange={set(k)}>{opts.map((o) => <option key={o} value={o}>{map[o] || o}</option>)}</select></label>)

  return (
    <form id="job-form" onSubmit={submit} noValidate className="aform">
      {text('title', 'Nomi *', { 'data-autofocus': true })}
      <div className="aform__row">{text('company', 'Kompaniya *')}{text('location', 'Joylashuv *')}</div>
      <div className="aform__row">{select('type', 'Turi', TYPES, TYPE_LABEL)}{select('workMode', 'Ish rejimi', MODES, WORK_MODE_LABEL)}{select('level', 'Daraja', LEVELS, LEVEL_LABEL)}</div>
      <div className="aform__row">{text('stipend', 'Stipendiya / maosh', { placeholder: 'Soatiga $25–30' })}
        <label className="field"><span className="field__label">Muddat</span><input className="input" type="date" value={f.deadline} onChange={set('deadline')} /></label></div>
      <div className="aform__row">
        {select('status', 'Holat', ['open', 'closed'], { open: 'Ochiq', closed: 'Yopiq' })}
        <label className="check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Bosh sahifada koʻrsatish</label>
      </div>
      <fieldset className="field aform__fs"><legend className="field__label">Brend rangi</legend>
        <div className="swatches">{ACCENT_SWATCHES.map((c) => <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={`Rang ${c}`} aria-pressed={f.accent.toLowerCase() === c.toLowerCase()} onClick={() => set('accent')(c)} />)}</div></fieldset>
      <label className="field"><span className="field__label">Koʻnikmalar (moslik balli uchun)</span><TagInput value={f.skills} onChange={set('skills')} placeholder="Koʻnikma kiriting va Enter bosing" /></label>
      <label className="field"><span className="field__label">Tavsif *</span><textarea className="textarea" value={f.description} onChange={set('description')} aria-invalid={!!errors.description} /><span className="field__error" role="alert">{errors.description}</span></label>
      <label className="field"><span className="field__label">Talablar</span><TagInput value={f.requirements} onChange={set('requirements')} placeholder="Har bir yozuvga bitta talab" /></label>
      <label className="field"><span className="field__label">Qulayliklar</span><TagInput value={f.benefits} onChange={set('benefits')} placeholder="Har bir yozuvga bitta qulaylik" /></label>
      <label className="field"><span className="field__label">Kompaniya haqida</span><textarea className="textarea" value={f.companyAbout} onChange={set('companyAbout')} /></label>
      <label className="field"><span className="field__label">Muqova rasmi (JPG, PNG, WEBP · 5 MB)</span>
        <input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {job?.imageUrl && !file && <img className="aform__img" src={assetUrl(job.imageUrl)} alt="Joriy muqova" />}</label>
      <div className="aform__foot">
        <button type="button" className="btn btn--ghost" onClick={onClose}>Bekor qilish</button>
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saqlanmoqda…' : job ? 'Oʻzgarishlarni saqlash' : 'Vakansiya yaratish'}</button>
      </div>
    </form>
  )
}

export default function JobsAdmin() {
  const toast = useToast()
  const confirm = useConfirm()
  const { data, error, loading, reload, setData } = useFetch((signal) => api('/api/jobs', { query: { status: 'all' }, signal }), [])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = new, object = edit
  const jobs = useMemo(() => (data?.jobs || []).filter((j) => `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q.toLowerCase())), [data, q])

  const remove = async (job) => {
    if (!(await confirm({ title: `“${job.title}” oʻchirilsinmi?`, body: 'Bu vakansiyaga tegishli arizalar va intervyular ham oʻchiriladi. Bu amalni qaytarib boʻlmaydi.', confirmLabel: 'Oʻchirish', danger: true }))) return
    const prev = data
    setData((d) => ({ ...d, jobs: d.jobs.filter((j) => j.id !== job.id) }))
    try { await api(`/api/jobs/${job.id}`, { method: 'DELETE' }); toast.success('Vakansiya oʻchirildi') } catch (e) { setData(prev); toast.error(e.message) }
  }
  const onSaved = (saved) => {
    setData((d) => ({ ...d, jobs: d.jobs.some((j) => j.id === saved.id) ? d.jobs.map((j) => (j.id === saved.id ? saved : j)) : [saved, ...d.jobs] }))
    setEditing(undefined)
  }

  return (
    <>
      <PageHead title="Vakansiyalar" subtitle="Talabalar ilovada va saytda koʻradigan e’lonlar.">
        <SearchBox value={q} onChange={setQ} placeholder="Vakansiya qidirish" />
        <button type="button" className="btn btn--primary" onClick={() => setEditing(null)}><Icon name="plus" size={18} /> Yangi vakansiya</button>
      </PageHead>
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton h={320} r="var(--r-md)" /> : jobs.length === 0 ? (
        <EmptyState icon="briefcase" title={q ? 'Mos vakansiya topilmadi' : 'Hozircha vakansiya yoʻq'} action={!q && <button type="button" className="btn btn--primary" onClick={() => setEditing(null)}>Birinchi vakansiyani yaratish</button>}>Yaratgan e’lonlaringiz talabalar ilovasida darhol paydo boʻladi.</EmptyState>
      ) : (
        <div className="tablewrap glass">
          <table className="table">
            <thead><tr><th>Lavozim</th><th>Turi</th><th>Muddat</th><th>Holat</th><th><span className="sr-only">Amallar</span></th></tr></thead>
            <tbody>{jobs.map((j) => (
              <tr key={j.id}>
                <td><div className="cell"><Monogram job={j} size={36} /><span><b>{j.title}</b>{j.featured && <Icon name="star" size={14} style={{ color: 'var(--mist)', marginLeft: 6 }} />}<br /><small className="muted">{j.company} · {j.location}</small></span></div></td>
                <td><span className="muted">{tr(TYPE_LABEL, j.type)} · {tr(WORK_MODE_LABEL, j.workMode)}</span></td>
                <td className="muted">{j.deadline ? fmtShort(j.deadline) : '—'}</td>
                <td><span className="pill" style={{ '--c': j.status === 'open' ? 'var(--paper)' : 'var(--muted)' }}>{j.status === 'open' ? 'Ochiq' : 'Yopiq'}</span></td>
                <td className="acts"><button type="button" className="btn btn--ghost btn--icon" aria-label={`Tahrirlash: ${j.title}`} onClick={() => setEditing(j)}><Icon name="edit" size={16} /></button><button type="button" className="btn btn--danger btn--icon" aria-label={`Oʻchirish: ${j.title}`} onClick={() => remove(j)}><Icon name="trash" size={16} /></button></td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      <Drawer open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Vakansiyani tahrirlash' : 'Yangi vakansiya'} width={600}>
        {editing !== undefined && <JobForm job={editing} onClose={() => setEditing(undefined)} onSaved={onSaved} />}
      </Drawer>
    </>
  )
}
