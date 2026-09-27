import FieldError from './FieldError'

/**
 * Labelled text input with an optional hint and an associated error message
 * (docs/UI_DESIGN.md §56). Remaining props (type, value, onChange,
 * autoComplete, ref…) go to the <input>.
 */
function TextField({ id, label, error, hint, required = false, className = '', ...inputProps }) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-1 font-normal text-ink-muted">(required)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <input
        id={id}
        name={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 block min-h-11 w-full rounded-sm border bg-surface px-3 text-base text-ink ${
          error ? 'border-danger' : 'border-border'
        }`}
        {...inputProps}
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

export default TextField
