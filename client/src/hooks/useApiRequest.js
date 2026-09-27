import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Runs `request({ signal })` whenever `key` changes, cancelling the previous
 * request. Returns `{ loading, data, error, reload, lastData }`:
 * - `data`/`error` belong to the current key only;
 * - `lastData` is the most recent successful result for any key (useful to
 *   keep filter options visible while the next page loads);
 * - `reload()` repeats the current request (e.g. Retry, or after a change).
 */
export default function useApiRequest(request, key) {
  const requestRef = useRef(request)
  useLayoutEffect(() => {
    requestRef.current = request
  })

  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const [lastData, setLastData] = useState(null)
  const requestId = `${key}::${attempt}`

  useEffect(() => {
    const controller = new AbortController()

    requestRef
      .current({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        setResult({ requestId, data, error: null })
        setLastData(data)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setResult({ requestId, data: null, error })
      })

    return () => controller.abort()
  }, [requestId])

  const current = result?.requestId === requestId ? result : null

  return {
    loading: !current,
    data: current?.data ?? null,
    error: current?.error ?? null,
    reload: () => setAttempt((value) => value + 1),
    lastData,
  }
}
