import { Link } from 'react-router'

const VARIANTS = {
  primary: 'bg-accent text-on-dark hover:bg-accent-strong',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
}

/** A router link styled as a button (docs/UI_DESIGN.md §12–§13). */
function ButtonLink({ variant = 'primary', className = '', ...props }) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 text-sm font-semibold transition-colors ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export default ButtonLink
