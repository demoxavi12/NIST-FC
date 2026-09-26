import { AlertCircle } from 'lucide-react'

/**
 * Labelled text input with an associated error message (docs/UI_DESIGN.md
 * §56). Remaining props (type, value, onChange, autoComplete, ref…) go to the
 * <input>. Errors are marked with an icon and text, not colour alone.
 */
function TextField({ id, label, error, required = false, className = '', ...inputProps }) {
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-1 font-normal text-ink-muted">(required)</span>}
      </label>
      <input
        id={id}
        name={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 block min-h-11 w-full rounded-sm border bg-surface px-3 text-base text-ink ${
          error ? 'border-ink' : 'border-border'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ink">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default TextField
