// Public job data with an honest offline fallback: when the API cannot be reached we serve the
// built-in sample jobs and flag the result with `demo: true` so the UI can say so.
import { api, ApiError } from './api'
import { SAMPLE_JOBS, SAMPLE_META, findSampleJob } from './sampleJobs'

const unreachable = (e) => e instanceof ApiError && e.status === 0

function filterSample(q = {}) {
  const needle = (q.search || '').toLowerCase()
  let list = SAMPLE_JOBS.filter((j) => {
    if (q.status !== 'all' && q.status !== 'closed' && j.status !== 'open') return false
    if (q.featured && !j.featured) return false
    if (q.type && j.type !== q.type) return false
    if (q.workMode && j.workMode !== q.workMode) return false
    if (q.level && j.level !== q.level) return false
    if (q.skill && !j.skills.includes(q.skill)) return false
    if (needle && !`${j.title} ${j.company} ${j.location} ${j.skills.join(' ')}`.toLowerCase().includes(needle)) return false
    return true
  })
  if (q.sort === 'deadline') list = [...list].sort((a, b) => new Date(a.deadline || 8.64e15) - new Date(b.deadline || 8.64e15))
  return list
}

export async function fetchJobs(query, signal) {
  try {
    const { jobs } = await api('/api/jobs', { query, signal, auth: false })
    return { jobs, demo: false }
  } catch (e) {
    if (unreachable(e)) return { jobs: filterSample(query), demo: true }
    throw e
  }
}

/** Featured jobs, or the newest open jobs when nothing is featured yet. */
export async function fetchFeatured(signal) {
  const res = await fetchJobs({ featured: true }, signal)
  if (res.jobs.length) return res
  return fetchJobs({}, signal)
}

export async function fetchJob(id, signal) {
  try {
    const { job } = await api(`/api/jobs/${encodeURIComponent(id)}`, { signal, auth: false })
    return { job, demo: false }
  } catch (e) {
    if (unreachable(e)) {
      const job = findSampleJob(id)
      if (job) return { job, demo: true }
      throw new ApiError('Vakansiya topilmadi', 404)
    }
    throw e
  }
}

function sampleSkills() {
  const counts = new Map()
  SAMPLE_JOBS.forEach((j) => j.skills.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)))
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

export async function fetchMeta(signal) {
  try {
    return await api('/api/jobs/meta', { signal, auth: false })
  } catch (e) {
    if (unreachable(e)) return { ...SAMPLE_META, skills: sampleSkills() }
    throw e
  }
}

/** Only the real thing: admin screens never fall back to sample data. */
export const adminMeta = (signal) => api('/api/jobs/meta', { signal, auth: false }).catch(() => ({ ...SAMPLE_META, skills: [] }))
