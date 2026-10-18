import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, loadStoredToken, onUnauthorized, setToken } from './api'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(() => !!loadStoredToken())
  const [notice, setNotice] = useState('')

  const logout = useCallback((message = '') => {
    setToken(null); setUser(null); setNotice(message)
  }, [])

  useEffect(() => { onUnauthorized(() => logout('Seansingiz tugadi. Iltimos, qaytadan kiring.')) }, [logout])

  useEffect(() => {
    if (!getToken()) { setBooting(false); return undefined }
    let live = true
    api('/api/auth/me')
      .then(({ user: u }) => { if (live) { if (u.role === 'admin') setUser(u); else logout() } })
      .catch((e) => { if (live && e.status !== 0) logout() })   // keep token if the server is merely unreachable
      .finally(() => live && setBooting(false))
    return () => { live = false }
  }, [logout])

  const login = useCallback(async (email, password) => {
    const res = await api('/api/auth/login', { method: 'POST', body: { email, password }, auth: false })
    if (res.user?.role !== 'admin') {
      const err = new Error('Bu hisobda administrator huquqi yoʻq.')
      err.status = 403
      throw err
    }
    setToken(res.token); setUser(res.user); setNotice('')
    return res.user
  }, [])

  const value = useMemo(() => ({ user, booting, notice, login, logout, isAdmin: user?.role === 'admin' }), [user, booting, notice, login, logout])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
