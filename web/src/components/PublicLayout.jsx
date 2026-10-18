import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AuroraBackground from './AuroraBackground'
import Footer from './Footer'
import SiteNav from './SiteNav'
import { FullSpinner } from './States'

/** Scroll to top on route change, or to the #hash target (retrying while a lazy page mounts). */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined }
    let tries = 0
    let t
    const go = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) el.scrollIntoView({ block: 'start' })
      else if (tries++ < 25) t = setTimeout(go, 100)
    }
    t = setTimeout(go, 120)
    return () => clearTimeout(t)
  }, [pathname, hash])
  return null
}

export default function PublicLayout() {
  return (
    <>
      <AuroraBackground />
      <SiteNav />
      <ScrollManager />
      <main id="main" tabIndex={-1} className="main">
        <Suspense fallback={<FullSpinner label="Sahifa yuklanmoqda" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
