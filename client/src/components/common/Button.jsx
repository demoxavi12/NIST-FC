import { Link } from 'react-router'

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60'

const VARIANTS = {
  primary: 'bg-accent text-on-dark hover:bg-accent-strong',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
}

/**
 * Button styles for the whole site (docs/UI_DESIGN.md §12–§13).
 * Renders a router <Link> when `to` is given, otherwise a <button>.
 */
function Button({ to, variant = 'primary', type = 'button', className = '', ...props }) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`

  if (to !== undefined) return <Link to={to} className={classes} {...props} />
  return <button type={type} className={classes} {...props} />
}

export default Button
