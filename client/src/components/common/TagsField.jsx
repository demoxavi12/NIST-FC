import { X } from 'lucide-react'
import { useState } from 'react'
import FieldError from './FieldError'

/**
 * Free-text tags as removable chips. Tags are trimmed, lower-cased and kept
 * unique, as the API stores them. Enter or a comma adds the typed tag.
 */
function TagsField({ id, label, tags, onChange, maxTags, maxLength, error }) {
  const [text, setText] = useState('')
  const [inputError, setInputError] = useState(null)
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const shownError = inputError ?? error

  function addTag() {
    const tag = text.trim().toLowerCase()
    if (!tag) return
    if (tag.length > maxLength) {
      setInputError(`Each tag must be at most ${maxLength} characters`)
      return
    }
    if (!tags.includes(tag)) {
      if (tags.length >= maxTags) {
        setInputError(`A memory can have at most ${maxTags} tags`)
        return
      }
      onChange([...tags, tag])
    }
    setText('')
    setInputError(null)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <p id={hintId} className="mt-1 text-sm text-ink-muted">
        Press Enter or comma to add a tag, e.g. “tournament”. Up to {maxTags} tags.
      </p>

      {tags.length > 0 && (
        <ul aria-label="Selected tags" className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-surface-muted py-0.5 pr-1 pl-3 text-sm font-semibold text-ink"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((value) => value !== tag))}
                aria-label={`Remove tag ${tag}`}
                className="inline-flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex gap-2">
        <input
          id={id}
          name={id}
          type="text"
          value={text}
          maxLength={maxLength + 10}
          autoComplete="off"
          aria-invalid={shownError ? true : undefined}
          aria-describedby={[hintId, shownError && errorId].filter(Boolean).join(' ')}
          onChange={(event) => {
            setText(event.target.value)
            setInputError(null)
          }}
          onKeyDown={handleKeyDown}
          className={`block min-h-11 w-full rounded-sm border bg-surface px-3 text-base text-ink ${
            shownError ? 'border-danger' : 'border-border'
          }`}
        />
        <button
          type="button"
          onClick={addTag}
          className="inline-flex min-h-11 shrink-0 items-center rounded-sm border border-border bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-muted"
        >
          Add tag
        </button>
      </div>

      <FieldError id={errorId}>{shownError}</FieldError>
    </div>
  )
}

export default TagsField
