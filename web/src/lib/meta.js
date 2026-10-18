import { useEffect } from 'react'

const DEFAULT_TITLE = 'Ilmgo — Kampusdan karyeragacha, bitta orbitada'
const DEFAULT_DESC = 'Ilmgo — universitet karyera markazi: stajirovkalarni toping, bir necha daqiqada ariza topshiring, intervyuga yoziling va har bir taklifni bir joyda kuzating.'

function setContent(selector, value) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute('content', value)
}

function apply(title, description) {
  document.title = title
  setContent('meta[name="description"]', description)
  setContent('meta[property="og:title"]', title)
  setContent('meta[property="og:description"]', description)
  setContent('meta[name="twitter:title"]', title)
  setContent('meta[name="twitter:description"]', description)
}

/** Per-page <title> + description + og/twitter tags. Restores the defaults on unmount. */
export function useMeta({ title, description } = {}) {
  useEffect(() => {
    apply(title ? `${title} · Ilmgo` : DEFAULT_TITLE, description || DEFAULT_DESC)
    return () => apply(DEFAULT_TITLE, DEFAULT_DESC)
  }, [title, description])
}
