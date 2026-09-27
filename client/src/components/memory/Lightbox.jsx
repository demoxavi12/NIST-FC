import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage'

// Horizontal swipe distance (px) that changes photo on touch screens.
const SWIPE_THRESHOLD = 50
const largeUrl = (url) => cloudinaryImageUrl(url, { width: 1600, height: 1600, crop: 'limit' })

/**
 * Full-size photo viewer on the native <dialog> (docs/UI_DESIGN.md §34–§35):
 * focus is trapped and returns to the thumbnail on close; ← / → change photo,
 * Esc closes; touch users can swipe. Large images load only when shown, and
 * the next one is preloaded. `index` is null when closed.
 */
function Lightbox({ photos, index, title, onClose, onIndexChange }) {
  const dialogRef = useRef(null)
  const swipeStartRef = useRef(null)
  const open = index !== null
  const count = photos.length

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Preload the next photo so moving forward feels instant.
  useEffect(() => {
    if (!open || count < 2) return
    const preload = new Image()
    preload.src = largeUrl(photos[(index + 1) % count].url)
  }, [open, index, count, photos])

  const show = (next) => onIndexChange((next + count) % count)

  function handleKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      show(index + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      show(index - 1)
    }
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'touch') swipeStartRef.current = event.clientX
  }

  function handlePointerUp(event) {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (start === null || event.pointerType !== 'touch') return
    const distance = event.clientX - start
    if (distance <= -SWIPE_THRESHOLD) show(index + 1)
    else if (distance >= SWIPE_THRESHOLD) show(index - 1)
  }

  const navButton =
    'inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary/80 text-on-dark hover:bg-secondary'

  return (
    <dialog
      ref={dialogRef}
      aria-label={open ? `Photo ${index + 1} of ${count} from ${title}` : `Photos from ${title}`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={open ? handleKeyDown : undefined}
      className="surface-dark m-0 h-dvh max-h-none w-screen max-w-none p-0 backdrop:bg-primary/90"
    >
      {open && (
        <div
          className="flex h-full flex-col"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p aria-live="polite" className="text-sm font-semibold">
              {index + 1} of {count}
            </p>
            <button type="button" onClick={onClose} className={navButton} aria-label="Close photo viewer">
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center gap-2 px-2 pb-4 md:gap-4 md:px-4">
            {count > 1 && (
              <button type="button" onClick={() => show(index - 1)} className={navButton} aria-label="Previous photo">
                <ChevronLeft aria-hidden="true" className="size-6" />
              </button>
            )}
            <img
              key={photos[index].publicId}
              src={largeUrl(photos[index].url)}
              alt={`Photo ${index + 1} of ${count} from ${title}`}
              className="max-h-full max-w-full min-w-0 object-contain select-none"
              draggable="false"
            />
            {count > 1 && (
              <button type="button" onClick={() => show(index + 1)} className={navButton} aria-label="Next photo">
                <ChevronRight aria-hidden="true" className="size-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}

export default Lightbox
