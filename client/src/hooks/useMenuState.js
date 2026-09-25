import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'

/**
 * Open/close state for a collapsible navigation panel (public mobile menu,
 * admin mobile sidebar).
 *
 * While open, the panel:
 * - closes on navigation, on Escape (returning focus to the toggle button),
 *   and when the viewport matches `closeAtQuery` (where the panel is unused);
 * - locks page scrolling behind it.
 *
 * Attach `toggleRef` to the toggle button.
 */
export default function useMenuState(closeAtQuery) {
  const { pathname } = useLocation()
  // The menu belongs to the page it was opened on, so any navigation closes it.
  const [openedAt, setOpenedAt] = useState(null)
  const isOpen = openedAt === pathname
  const toggleRef = useRef(null)

  const close = () => setOpenedAt(null)
  const toggle = () => setOpenedAt(isOpen ? null : pathname)

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenedAt(null)
        toggleRef.current?.focus()
      }
    }
    const media = window.matchMedia(closeAtQuery)
    const handleMediaChange = (event) => {
      if (event.matches) setOpenedAt(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    media.addEventListener('change', handleMediaChange)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      media.removeEventListener('change', handleMediaChange)
      // Forget the opening page so back/forward navigation cannot reopen it.
      setOpenedAt(null)
    }
  }, [isOpen, closeAtQuery])

  return { isOpen, toggle, close, toggleRef }
}
