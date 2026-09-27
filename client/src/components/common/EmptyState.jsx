/** Explains why there is nothing to show, with an optional action (docs/UI_DESIGN.md §59). */
function EmptyState({ title, message, children }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-12 text-center">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {message && <p className="mt-2 text-sm text-ink-muted">{message}</p>}
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  )
}

export default EmptyState
