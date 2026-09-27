import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

const DEBOUNCE_MS = 300

/**
 * Search box that reports its text through `onSearch` once typing pauses.
 * `value` is the committed search (e.g. from the URL); when it changes from
 * outside — Clear filters, browser Back — the box follows it.
 */
function SearchInput({ id, label, value, onSearch, placeholder, className = '' }) {
  const [text, setText] = useState(value)
  const [committed, setCommitted] = useState(value)
  const [sent, setSent] = useState(value)

  // Follow outside changes, but never overwrite newer typing with the value
  // this box itself just sent.
  if (value !== committed) {
    setCommitted(value)
    if (value !== sent) setText(value)
  }

  useEffect(() => {
    if (text === value) return undefined
    const timer = setTimeout(() => {
      setSent(text)
      onSearch(text)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, value, onSearch])

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          id={id}
          type="search"
          value={text}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          className="block min-h-11 w-full rounded-sm border border-border bg-surface pr-3 pl-9 text-base text-ink"
        />
      </div>
    </div>
  )
}

export default SearchInput
