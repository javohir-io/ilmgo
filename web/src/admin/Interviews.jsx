import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import StatusPill from '../components/StatusPill'
import { useToast } from '../components/Toast'
import { api } from '../lib/api'
import { endTime, fmtDay } from '../lib/format'
import { useFetch } from '../lib/hooks'
import { STATUS_LABEL } from '../lib/i18n'
import { Avatar, PageHead } from './ui'

export default function Interviews() {
  const toast = useToast()
  const { data, error, loading, reload, setData } = useFetch((signal) => api('/api/admin/interviews', { signal }), [])
  const [show, setShow] = useState('scheduled')
  const list = useMemo(() => (data?.interviews || []).filter((i) => show === 'all' || i.status === show), [data, show])
  const groups = useMemo(() => {
    const m = new Map()
    list.forEach((i) => { if (!m.has(i.date)) m.set(i.date, []); m.get(i.date).push(i) })
    return [...m.entries()].sort(([a], [b]) => (show === 'scheduled' ? a.localeCompare(b) : b.localeCompare(a)))
  }, [list, show])

  const complete = async (id) => {
    try {
      const { interview } = await api(`/api/admin/interviews/${id}/complete`, { method: 'POST' })
      setData((d) => ({ ...d, interviews: d.interviews.map((i) => (i.id === id ? { ...i, ...interview } : i)) }))
      toast.success('Yakunlangan deb belgilandi')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <>
      <PageHead title="Intervyular" subtitle="Barcha band qilingan vaqtlar, kunlar boʻyicha guruhlangan.">
        <div className="seg" role="group" aria-label="Filtr">{['scheduled', 'completed', 'cancelled', 'all'].map((s) => <button key={s} type="button" aria-pressed={show === s} onClick={() => setShow(s)}>{s === 'all' ? 'Hammasi' : STATUS_LABEL[s]}</button>)}</div>
      </PageHead>
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton h={260} r="var(--r-md)" /> : groups.length === 0 ? <EmptyState icon="calendar" title="Bu yerda intervyu yoʻq">Talaba vaqtni tanlashi bilan band qilingan intervyular shu yerda koʻrinadi.</EmptyState> : (
        <div className="days">{groups.map(([date, items]) => (
          <section key={date} className="day"><h2 className="day__h">{fmtDay(date)} <span className="faint">· {items.length}</span></h2>
            <ul className="day__list">{items.sort((a, b) => a.time.localeCompare(b.time)).map((i) => (
              <li key={i.id} className="glass irow">
                <span className="irow__t num"><b>{i.time}</b><small className="faint">– {endTime(i.time, i.durationMin)}</small></span>
                <Avatar name={i.user?.name} />
                <span className="irow__who"><b>{i.user?.name}</b><small className="muted">{i.job?.title} · {i.job?.company}</small>{i.reason && <small className="faint">“{i.reason}”</small>}</span>
                <StatusPill status={i.status} />
                {i.status === 'scheduled' && <button type="button" className="btn btn--ghost btn--sm" onClick={() => complete(i.id)}><Icon name="check" size={14} /> Yakunlash</button>}
              </li>))}</ul></section>))}</div>
      )}
    </>
  )
}
