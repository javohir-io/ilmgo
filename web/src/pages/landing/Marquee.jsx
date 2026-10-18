import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Monogram, deadlineLabel } from '../../components/JobCard'
import Icon from '../../components/Icon'
import { fetchFeatured } from '../../lib/jobsData'
import { WORK_MODE_LABEL, label } from '../../lib/i18n'

/** Endless strip of live featured jobs (CSS animation, pauses on hover/focus, static under reduced motion). */
export default function Marquee() {
  const [state, setState] = useState({ jobs: [], demo: false })
  useEffect(() => {
    const ac = new AbortController()
    fetchFeatured(ac.signal).then(setState).catch(() => {})
    return () => ac.abort()
  }, [])
  if (!state.jobs.length) return null
  const loop = [...state.jobs, ...state.jobs]
  return (
    <section className="marquee" aria-label="Tanlangan stajirovkalar">
      <div className="marquee__track">
        {loop.map((j, i) => (
          <Link key={`${j.id}-${i}`} to={`/jobs/${j.id}`} className="marquee__item glass" aria-hidden={i >= state.jobs.length ? 'true' : undefined} tabIndex={i >= state.jobs.length ? -1 : undefined}>
            <Monogram job={j} size={36} />
            <span className="marquee__txt"><strong>{j.title}</strong><small className="muted">{j.company} · {label(WORK_MODE_LABEL, j.workMode)} · {deadlineLabel(j)}</small></span>
            <Icon name="arrow-up-right" size={16} />
          </Link>
        ))}
      </div>
      {state.demo && <p className="marquee__note faint">Demo maʼlumotlar koʻrsatilmoqda — jonli vakansiyalarni koʻrish uchun backendni ishga tushiring.</p>}
    </section>
  )
}
