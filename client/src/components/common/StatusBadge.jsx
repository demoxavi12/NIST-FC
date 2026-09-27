import { PLAYER_STATUS_LABELS } from '../../constants/players'

/**
 * Player status as a small text label (docs/UI_DESIGN.md §25, §83). Current
 * and former share one neutral style so former players are never visually
 * diminished; the text itself carries the meaning.
 */
function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-border px-2 py-0.5 text-xs font-semibold tracking-widest text-ink-muted uppercase ${className}`}
    >
      {PLAYER_STATUS_LABELS[status] ?? status}
    </span>
  )
}

export default StatusBadge
