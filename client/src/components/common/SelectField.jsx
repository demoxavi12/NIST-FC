import FieldError from './FieldError'

/**
 * Labelled <select>. `options` are `{ value, label }`; `placeholder` adds an
 * empty first option (e.g. "Select a position" or "All positions").
 */
function SelectField({
  id,
  label,
  options,
  placeholder,
  error,
  required = false,
  hideLabel = false,
  className = '',
  ...selectProps
}) {
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'block text-sm font-semibold text-ink'}
      >
        {label}
        {required && <span className="ml-1 font-normal text-ink-muted">(required)</span>}
      </label>
      <select
        id={id}
        name={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${hideLabel ? '' : 'mt-2'} block min-h-11 w-full rounded-sm border bg-surface px-3 text-base text-ink ${
          error ? 'border-danger' : 'border-border'
        }`}
        {...selectProps}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

export default SelectField
