import { STATUS_COLORS } from '../lib/tokens'
import { STATUS_LABEL, label } from '../lib/i18n'

export default function StatusPill({ status }) {
  return <span className="pill" style={{ '--c': STATUS_COLORS[status] || 'var(--muted)' }}>{label(STATUS_LABEL, status)}</span>
}
