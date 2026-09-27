import FieldError from './FieldError'

/** Labelled <textarea> with a character count when `maxLength` is set. */
function TextAreaField({ id, label, error, maxLength, value = '', className = '', ...textareaProps }) {
  const errorId = `${id}-error`
  const countId = `${id}-count`
  const describedBy = [maxLength && countId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 block min-h-32 w-full rounded-sm border bg-surface px-3 py-2 text-base text-ink ${
          error ? 'border-danger' : 'border-border'
        }`}
        {...textareaProps}
      />
      {maxLength && (
        <p id={countId} className="mt-1 text-right text-xs text-ink-muted">
          {value.length}/{maxLength} characters
        </p>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

export default TextAreaField
