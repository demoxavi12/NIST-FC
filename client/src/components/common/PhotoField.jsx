import { ImageUp } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import FieldError from './FieldError'

/**
 * Image picker with a preview (docs/UI_DESIGN.md §53). Shows the chosen file,
 * or `currentUrl` when editing. The preview's object URL is released when the
 * file changes or the field unmounts.
 */
function PhotoField({
  id,
  label,
  file,
  currentUrl,
  onChange,
  error,
  hint,
  accept,
  required = false,
  ref,
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    if (!previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const shown = previewUrl ?? currentUrl

  return (
    <div>
      <p id={`${id}-label`} className="block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-1 font-normal text-ink-muted">(required)</span>}
      </p>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-sm border border-border bg-surface-muted">
          {shown ? (
            <img
              src={shown}
              alt={previewUrl ? 'Preview of the new photo' : 'Current photo'}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-ink-muted">
              <ImageUp aria-hidden="true" className="size-8" />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor={id}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
          >
            <ImageUp aria-hidden="true" className="size-4" />
            {shown ? 'Replace photo' : 'Choose photo'}
            <input
              ref={ref}
              id={id}
              name={id}
              type="file"
              accept={accept}
              className="sr-only"
              aria-labelledby={`${id}-label`}
              aria-required={required || undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
              onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            />
          </label>
          {file && <p className="mt-2 text-sm break-all text-ink-muted">{file.name}</p>}
        </div>
      </div>

      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

export default PhotoField
