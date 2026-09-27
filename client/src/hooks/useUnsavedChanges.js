import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router'

/**
 * Warns before leaving a form with unsaved changes: in-app navigation is
 * blocked (render a confirmation while `blocker.state === 'blocked'`), and
 * closing or reloading the tab shows the browser's own prompt.
 * Call `allowNavigation()` just before navigating away after a save.
 */
export default function useUnsavedChanges(dirty) {
  const allowRef = useRef(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !allowRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return undefined
    function handleBeforeUnload(event) {
      if (allowRef.current) return
      event.preventDefault()
      // Required by some browsers to show the prompt.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  return {
    blocker,
    allowNavigation: () => {
      allowRef.current = true
    },
  }
}
