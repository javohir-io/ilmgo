import '../styles/pages.css'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { Monogram } from '../components/JobCard'
import { ErrorState, Skeleton } from '../components/States'
import { assetUrl } from '../lib/api'
import { fmtDate } from '../lib/format'
import { useCountdown, useFetch } from '../lib/hooks'
import { fetchJob } from '../lib/jobsData'
import { useMeta } from '../lib/meta'
import { LEVEL_LABEL, TYPE_LABEL, WORK_MODE_LABEL, label } from '../lib/i18n'

function Countdown({ iso }) {
  const c = useCountdown(iso)
  if (!c) return <p className="muted">Oʻrin toʻlguncha ochiq</p>
  if (c.over) return <p className="muted">Muddat tugagan</p>
  return (
    <div className="cd" role="timer" aria-label="Ariza topshirishga qolgan vaqt">
      {[['kun', c.days], ['soat', c.hours], ['daq', c.minutes], ['son', c.seconds]].map(([u, v]) => (
        <span key={u} className="cd__cell"><b className="num">{String(v).padStart(2, '0')}</b><small className="faint">{u}</small></span>
      ))}
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const { data, error, loading, reload } = useFetch((s) => fetchJob(id, s), [id])
  const job = data?.job
  useMeta({ title: job ? `${job.title} · ${job.company}` : 'Vakansiya', description: job?.description?.slice(0, 150) })

  if (loading && !job) return <div className="container page"><Skeleton h={220} r="var(--r-lg)" /><Skeleton h={320} r="var(--r-lg)" style={{ marginTop: 16 }} /></div>
  if (error || !job) return <div className="container page"><ErrorState error={error} title={error?.status === 404 ? 'Bunday vakansiya mavjud emas' : undefined} onRetry={error?.status === 404 ? undefined : reload} /><p style={{ textAlign: 'center' }}><Link to="/jobs" className="btn btn--ghost">Barcha vakansiyalar</Link></p></div>

  return (
    <div className="container page jd" style={{ '--accent': job.accent || 'var(--azure)' }}>
      <Link to="/jobs" className="back muted"><Icon name="arrow-up-right" size={16} style={{ transform: 'rotate(-135deg)' }} /> Barcha vakansiyalar</Link>
      <header className="jd__hero glass glass--lg" style={job.imageUrl ? { '--img': `url("${assetUrl(job.imageUrl)}")` } : undefined}>
        <Monogram job={job} size={64} />
        <div>
          <h1 className="jd__title">{job.title}</h1>
          <p className="muted">{job.company} · {job.location}</p>
          <div className="job__chips" style={{ marginTop: 12 }}>
            <span className="chip">{label(TYPE_LABEL, job.type)}</span><span className="chip">{label(WORK_MODE_LABEL, job.workMode)}</span><span className="chip">{label(LEVEL_LABEL, job.level)}</span>
            {job.stipend && <span className="chip">{job.stipend}</span>}
            {job.status === 'closed' && <span className="pill" style={{ '--c': 'var(--danger)' }}>yopiq</span>}
          </div>
        </div>
      </header>

      <div className="jd__cols">
        <div className="jd__main">
          <section className="glass jd__card"><h2>Lavozim haqida</h2><p className="muted">{job.description}</p></section>
          {job.requirements?.length > 0 && <section className="glass jd__card"><h2>Talablar</h2><ul className="tick">{job.requirements.map((r) => <li key={r}><Icon name="check" size={16} />{r}</li>)}</ul></section>}
          {job.benefits?.length > 0 && <section className="glass jd__card"><h2>Qulayliklar</h2><ul className="tick">{job.benefits.map((r) => <li key={r}><Icon name="sparkle" size={16} />{r}</li>)}</ul></section>}
          {job.companyAbout && <section className="glass jd__card"><h2>{job.company} haqida</h2><p className="muted">{job.companyAbout}</p></section>}
        </div>
        <aside className="jd__side">
          <div className="glass jd__card">
            <h2>Ariza topshirish muddati</h2>
            <p className="muted">{job.deadline ? fmtDate(job.deadline) : 'Muddat belgilanmagan'}</p>
            {job.status === 'open' && <Countdown iso={job.deadline} />}
            <h3 className="jd__sk">Koʻnikmalar</h3>
            <ul className="job__skills">{job.skills.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="glass glass--lg jd__card jd__apply">
            <Icon name="phone" size={22} />
            <h2>Ilmgo ilovasida ariza bering</h2>
            <p className="muted">Ariza topshirish, intervyuga yozilish va holatni jonli kuzatish talaba ilovasida amalga oshiriladi. Bu vakansiyaga qanchalik mosligingizni koʻrish uchun u yerda tizimga kiring.</p>
            <Link to={{ pathname: '/', hash: '#app' }} className="btn btn--primary">Ilovani yuklash</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
