import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import { api } from '../lib/api'
import { fmtShort } from '../lib/format'
import { useFetch } from '../lib/hooks'
import { Avatar, PageHead, SearchBox } from './ui'

export default function Students() {
  const { data, error, loading, reload } = useFetch((signal) => api('/api/admin/users', { signal }), [])
  const [q, setQ] = useState('')
  const users = useMemo(() => (data?.users || []).filter((u) => u.role !== 'admin' && `${u.name} ${u.email} ${u.university} ${(u.skills || []).join(' ')}`.toLowerCase().includes(q.toLowerCase())), [data, q])
  return (
    <>
      <PageHead title="Talabalar" subtitle="Ilovada roʻyxatdan oʻtgan barcha foydalanuvchilar."><SearchBox value={q} onChange={setQ} placeholder="Ism, universitet yoki koʻnikma boʻyicha qidirish" /></PageHead>
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton h={320} r="var(--r-md)" /> : users.length === 0 ? <EmptyState icon="users" title="Talabalar topilmadi" /> : (
        <div className="tablewrap glass"><table className="table">
          <thead><tr><th>Talaba</th><th>Universitet</th><th>Koʻnikmalar</th><th>Arizalar</th><th>Profil</th><th>Qoʻshilgan</th></tr></thead>
          <tbody>{users.map((u) => (<tr key={u.id}>
            <td><div className="cell"><Avatar name={u.name} /><span><b>{u.name}</b><br /><small className="muted">{u.email}</small></span></div></td>
            <td className="muted">{u.university || '—'}<br /><small className="faint">{u.degreeProgram}</small></td>
            <td><ul className="job__skills">{(u.skills || []).slice(0, 4).map((s) => <li key={s}>{s}</li>)}{(u.skills || []).length > 4 && <li>+{u.skills.length - 4}</li>}</ul></td>
            <td className="num">{u.applications ?? 0}</td>
            <td><div className="meter meter--sm" aria-label={`${u.profileCompleteness}% toʻldirilgan`}><i style={{ '--w': `${u.profileCompleteness || 0}%` }} /></div></td>
            <td className="muted">{fmtShort(u.createdAt)}</td></tr>))}</tbody></table></div>
      )}
    </>
  )
}
