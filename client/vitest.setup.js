import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount rendered components between tests (Vitest globals are not enabled,
// so Testing Library cannot register this automatically).
afterEach(() => {
  cleanup()
})

// jsdom does not implement modal dialogs or object URLs; these minimal
// stand-ins let components that use them render in tests.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = () => {}
}
