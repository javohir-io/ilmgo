import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useMeta } from '../lib/meta'

export default function NotFound() {
  useMeta({ title: 'Sahifa topilmadi' })
  return (
    <div className="full-center">
      <div className="state">
        <div className="state__icon"><Icon name="alert" size={26} /></div>
        <h1 className="h-section">Orbitada adashdingiz</h1>
        <p className="muted">Bunday sahifa topilmadi.</p>
        <Link to="/" className="btn btn--primary">Ilmgoga qaytish</Link>
      </div>
    </div>
  )
}
