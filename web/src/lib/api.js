// Tiny fetch wrapper: JSON + multipart, bearer token, ApiError, global 401 hook.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const TOKEN_KEY = 'ilmgo.token'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

let memoryToken = null
let unauthorizedHandler = null

export function loadStoredToken() {
  try { memoryToken = localStorage.getItem(TOKEN_KEY) } catch { /* storage blocked */ }
  return memoryToken
}
export function getToken() { return memoryToken }
export function setToken(t) {
  memoryToken = t || null
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}
export function onUnauthorized(fn) { unauthorizedHandler = fn }

export const apiBase = BASE
export const assetUrl = (p) => (!p ? '' : /^(https?:|data:|blob:)/.test(p) ? p : BASE + p)

function qs(query) {
  if (!query) return ''
  const sp = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) sp.set(k, v === true ? '1' : String(v)) })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/**
 * api('/api/jobs', { query, method, body, form, auth, signal, raw })
 * `body` is JSON-encoded; `form` is a FormData (multipart). Returns parsed JSON (or Response when raw).
 */
export async function api(path, { method = 'GET', query, body, form, auth = true, signal, raw = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (auth && memoryToken) headers.Authorization = `Bearer ${memoryToken}`
  let payload
  if (form) payload = form
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }

  let res
  try {
    res = await fetch(BASE + path + qs(query), { method, headers, body: payload, signal })
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    throw new ApiError('Ilmgo serveriga ulanib boʻlmadi. Backend ishlayaptimi?', 0)
  }
  if (raw && res.ok) return res
  let data = null
  const text = await res.text()
  if (text) { try { data = JSON.parse(text) } catch { data = { raw: text } } }
  if (!res.ok) {
    if (res.status === 401 && auth && memoryToken && unauthorizedHandler) unauthorizedHandler()
    throw new ApiError(data?.error || `Soʻrov bajarilmadi (${res.status})`, res.status, data)
  }
  return data
}

export const get = (path, opts) => api(path, opts)
export const post = (path, body, opts) => api(path, { method: 'POST', body, ...opts })
export const put = (path, body, opts) => api(path, { method: 'PUT', body, ...opts })
export const patch = (path, body, opts) => api(path, { method: 'PATCH', body, ...opts })
export const del = (path, opts) => api(path, { method: 'DELETE', ...opts })
