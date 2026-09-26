import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount rendered components between tests (Vitest globals are not enabled,
// so Testing Library cannot register this automatically).
afterEach(() => {
  cleanup()
})
