import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CountUp from '../components/CountUp'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import StatusPill from '../components/StatusPill'
import { Monogram } from '../components/JobCard'
import { api } from '../lib/api'
import { fmtDay, fmtShort } from '../lib/format'
import { useFetch } from '../lib/hooks'
import { STATUS_LABEL } from '../lib/i18n'
import { PageHead } from './ui'

const STATUSES = ['submitted', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn']
const W = 640; const H = 220; const PAD = { l: 34, r: 12, t: 16, b: 26 }

/** Custom SVG area chart: draw-in animation, nearest-point hover tooltip, keyboard-readable table fallback. */
function AreaChart({ data }) {
  const [hover, setHover] = useState(null)
  const ref = useRef(null)
  const max = Math.max(4, ...data.map((d) => d.count))
  const x = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(1, data.length - 1)
  const y = (v) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`
  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }
  const ticks = [0, Math.round(max / 2), max]
  return (
    <div className="chart">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Oxirgi 14 kundagi kunlik arizalar" onPointerMove={move} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--azure)" stopOpacity="0.55" /><stop offset="1" stopColor="var(--azure)" stopOpacity="0" /></linearGradient>
          <linearGradient id="area-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--azure)" /><stop offset="0.6" stopColor="var(--sky)" /><stop offset="1" stopColor="var(--mist)" /></linearGradient>
        </defs>
        {ticks.map((t) => (<g key={t}><line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="chart__grid" /><text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="chart__tick">{t}</text></g>))}
        {data.map((d, i) => (i % 3 === 0 || i === data.length - 1) && <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" className="chart__tick">{fmtShort(d.date)}</text>)}
        <path d={area} fill="url(#area-fill)" className="chart__area" />
        <path d={line} fill="none" stroke="url(#area-line)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="chart__line" />
        {hover !== null && (<g><line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="chart__cursor" /><circle cx={x(hover)} cy={y(data[hover].count)} r="5" fill="var(--bg)" stroke="var(--sky)" strokeWidth="2.5" /></g>)}
      </svg>
      {hover !== null && (
        <div className="chart__tip glass" style={{ left: `${(x(hover) / W) * 100}%` }} role="status"><b>{data[hover].count}</b> ta ariza<small className="faint"> · {fmtDay(data[hover].date)}</small></div>
      )}
      <table className="sr-only"><caption>Kunlik arizalar</caption><tbody>{data.map((d) => <tr key={d.date}><th>{d.date}</th><td>{d.count}</td></tr>)}</tbody></table>
    </div>
  )
}

function Donut({ byStatus }) {
  const total = STATUSES.reduce((s, k) => s + (byStatus[k] || 0), 0)
  let acc = 0
  return (
    <div className="donut">
      <svg viewBox="0 0 100 100" role="img" aria-label="Arizalar holat boʻyicha">
        <circle cx="50" cy="50" r="38" className="donut__track" />
        {total > 0 && STATUSES.map((k) => {
          const v = ((byStatus[k] || 0) / total) * 100
          const el = v > 0 && <circle key={k} cx="50" cy="50" r="38" pathLength="100" strokeDasharray={`${Math.max(0, v - 0.8)} ${100 - Math.max(0, v - 0.8)}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)" className="donut__seg" style={{ stroke: `var(--st-${k})` }} />
          acc += v
          return el
        })}
        <text x="50" y="50" textAnchor="middle" className="donut__num">{total}</text>
        <text x="50" y="63" textAnchor="middle" className="donut__cap">jami</text>
      </svg>
      <ul className="legend">{STATUSES.map((k) => <li key={k}><i style={{ background: `var(--st-${k})` }} /> <span className="muted">{STATUS_LABEL[k]}</span> <b className="num">{byStatus[k] || 0}</b></li>)}</ul>
    </div>
  )
}

export default function Overview() {
  const { data, error, loading, reload } = useFetch((signal) => api('/api/admin/stats', { signal }), [])
  const cards = useMemo(() => data && [
    ['Talabalar', data.totals.users], ['Ochiq vakansiyalar', data.totals.openJobs], ['Arizalar', data.totals.applications],
    ['Intervyular', data.totals.interviews], ['Takliflar', data.totals.offers],
  ], [data])
  if (error && !data) return <ErrorState error={error} onRetry={reload} />
  return (
    <>
      <PageHead title="Umumiy koʻrinish" subtitle="Ilmgoda hozir nimalar boʻlayotgani." />
      <div className="cards">
        {loading && !data ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} h={92} r="var(--r-md)" />)
          : cards.map(([l, v]) => <div key={l} className="stat glass"><span className="muted">{l}</span><strong><CountUp to={v} /></strong></div>)}
      </div>
      {data && (
        <div className="agrid">
          <section className="glass apanel apanel--wide"><h2>Arizalar · oxirgi 14 kun</h2><AreaChart data={data.applicationsPerDay} /></section>
          <section className="glass apanel"><h2>Holat boʻyicha</h2><Donut byStatus={data.applicationsByStatus} /></section>
          <section className="glass apanel">
            <h2>Eng koʻp ariza tushgan vakansiyalar</h2>
            {data.topJobs.length === 0 ? <EmptyState icon="briefcase" title="Hozircha ariza yoʻq" /> : (
              <ul className="bars">{data.topJobs.map((j) => (
                <li key={j.id}><Monogram job={j} size={32} /><span className="bars__main"><b>{j.title}</b><small className="muted">{j.company}</small><i className="bars__bar" style={{ '--w': `${(j.applications / data.topJobs[0].applications) * 100}%`, '--c': j.accent }} /></span><b className="num">{j.applications}</b></li>
              ))}</ul>)}
          </section>
          <section className="glass apanel">
            <h2>Yaqinlashayotgan intervyular <Link to="/admin/interviews" className="faint alink">Hammasi</Link></h2>
            {data.upcomingInterviews.length === 0 ? <EmptyState icon="calendar" title="Hech narsa rejalashtirilmagan" /> : (
              <ul className="ilist">{data.upcomingInterviews.map((i) => (
                <li key={i.id}><span className="ilist__when"><b>{i.time}</b><small className="muted">{fmtDay(i.date)}</small></span><span><b>{i.user?.name}</b><small className="muted"> · {i.job?.title}</small></span><StatusPill status={i.status} /></li>
              ))}</ul>)}
          </section>
        </div>
      )}
    </>
  )
}
