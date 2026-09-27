import { useEffect, useId, useRef } from 'react'
import Button from './Button'

/**
 * Modal confirmation using the native <dialog> (docs/UI_DESIGN.md §80): focus
 * is trapped, Escape cancels, the page behind is inert, and focus returns to
 * the triggering control on close. Cancel is focused first so a destructive
 * action is never the default.
 */
function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  pending = false,
  error,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleCancel(event) {
    // Escape: keep the dialog in sync with React state instead of closing directly.
    event.preventDefault()
    if (!pending) onCancel()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md bg-surface p-6 text-ink shadow-md backdrop:bg-primary/60"
    >
      {open && (
        <>
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <div className="mt-2 text-sm text-ink-muted">{children}</div>
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onCancel} disabled={pending} autoFocus>
              Cancel
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} disabled={pending}>
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </>
      )}
    </dialog>
  )
}

export default ConfirmDialog
