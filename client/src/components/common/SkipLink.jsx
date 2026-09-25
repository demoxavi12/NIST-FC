const MAIN_CONTENT_ID = 'main-content'

/**
 * First focusable element on every page. Moves keyboard focus past the
 * navigation to the page's <main id="main-content" tabIndex={-1}>.
 */
function SkipLink() {
  const handleClick = (event) => {
    const main = document.getElementById(MAIN_CONTENT_ID)
    if (!main) return
    // Focus directly instead of changing the URL hash, which the router owns.
    event.preventDefault()
    main.focus()
  }

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-md"
    >
      Skip to main content
    </a>
  )
}

export default SkipLink
