import { Link } from 'react-router-dom'
import { countdown, fmtShort, monogram } from '../lib/format'
import Icon from './Icon'
import { LEVEL_LABEL, TYPE_LABEL, WORK_MODE_LABEL, label } from '../lib/i18n'

export function Monogram({ job, size = 44 }) {
  return (
    <span className="mono-tile" style={{ '--accent': job.accent || 'var(--azure)', width: size, height: size }} aria-hidden="true">
      {monogram(job.company)}
    </span>
  )
}

export function deadlineLabel(job) {
  if (job.status === 'closed') return 'Yopilgan'
  const c = countdown(job.deadline)
  if (!c) return 'Oʻrin toʻlguncha ochiq'
  if (c.over) return 'Muddat tugagan'
  if (c.days === 0) return 'Bugun yopiladi'
  if (c.days <= 14) return `${c.days} kun qoldi`
  return `${fmtShort(job.deadline)} gacha`
}

export default function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="job glass card-hover" style={{ '--accent': job.accent || 'var(--azure)' }}>
      <div className="job__top">
        <Monogram job={job} />
        <div className="job__id">
          <h3 className="job__title">{job.title}</h3>
          <p className="muted job__company">{job.company}</p>
        </div>
        <Icon name="arrow-up-right" size={18} className="job__go" />
      </div>
      <div className="job__chips">
        <span className="chip">{label(TYPE_LABEL, job.type)}</span>
        <span className="chip">{label(WORK_MODE_LABEL, job.workMode)}</span>
        <span className="chip">{label(LEVEL_LABEL, job.level)}</span>
      </div>
      <p className="job__meta muted"><Icon name="pin" size={14} /> {job.location}{job.stipend ? ` · ${job.stipend}` : ''}</p>
      <div className="job__foot">
        <ul className="job__skills" aria-label="Koʻnikmalar">
          {job.skills.slice(0, 3).map((s) => <li key={s}>{s}</li>)}
          {job.skills.length > 3 && <li>+{job.skills.length - 3}</li>}
        </ul>
        <span className="job__deadline faint"><Icon name="clock" size={14} /> {deadlineLabel(job)}</span>
      </div>
    </Link>
  )
}
