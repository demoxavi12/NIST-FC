import { ImagePlus, Undo2, X } from 'lucide-react'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage'
import FieldError from './FieldError'

/**
 * A memory's gallery in the admin form (docs/UI_DESIGN.md §53). Saved photos
 * can be marked for removal (and restored before saving); new photos are
 * listed with previews in the order they will be uploaded. The parent owns
 * the preview object URLs: `newPhotos` is `[{ key, file, previewUrl }]`.
 */
function GalleryField({
  id,
  existingPhotos = [],
  removedIds,
  onToggleRemove,
  newPhotos,
  onAdd,
  onRemoveNew,
  maxPhotos,
  accept,
  hint,
  error,
}) {
  const keptCount = existingPhotos.length - removedIds.length
  const total = keptCount + newPhotos.length
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const tile = 'relative aspect-[4/3] overflow-hidden rounded-sm border border-border bg-surface-muted'
  const tileButton =
    'absolute top-1.5 right-1.5 inline-flex min-h-9 items-center gap-1 rounded-sm bg-surface px-2 text-xs font-semibold text-ink shadow-sm hover:bg-surface-muted'

  return (
    <div>
      <p id={`${id}-label`} className="block text-sm font-semibold text-ink">
        Gallery photos
      </p>
      <p id={hintId} className="mt-1 text-sm text-ink-muted">
        {hint} {total} of {maxPhotos} photos.
      </p>

      {existingPhotos.length > 0 && (
        <ul aria-label="Saved photos" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {existingPhotos.map((photo, index) => {
            const removed = removedIds.includes(photo.publicId)
            return (
              <li key={photo.publicId} className={tile}>
                <img
                  src={cloudinaryImageUrl(photo.url, { width: 320, height: 240 })}
                  alt={`Saved photo ${index + 1}`}
                  loading="lazy"
                  className={`size-full object-cover ${removed ? 'opacity-30' : ''}`}
                />
                {removed && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-danger px-2 py-0.5 text-xs font-semibold text-on-dark">
                    Will be removed
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onToggleRemove(photo.publicId)}
                  aria-label={`${removed ? 'Keep' : 'Remove'} saved photo ${index + 1}`}
                  className={tileButton}
                >
                  {removed ? (
                    <>
                      <Undo2 aria-hidden="true" className="size-3.5" />
                      Keep
                    </>
                  ) : (
                    <>
                      <X aria-hidden="true" className="size-3.5" />
                      Remove
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {newPhotos.length > 0 && (
        <ul aria-label="New photos to upload" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {newPhotos.map((photo, index) => (
            <li key={photo.key} className={tile}>
              <img src={photo.previewUrl} alt={`New photo ${index + 1}: ${photo.file.name}`} className="size-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-surface px-2 py-0.5 text-xs font-semibold text-ink">
                New
              </span>
              <button
                type="button"
                onClick={() => onRemoveNew(photo.key)}
                aria-label={`Remove new photo ${index + 1}`}
                className={tileButton}
              >
                <X aria-hidden="true" className="size-3.5" />
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <label
        htmlFor={id}
        className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
      >
        <ImagePlus aria-hidden="true" className="size-4" />
        Add photos
        <input
          id={id}
          name={id}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, error && errorId].filter(Boolean).join(' ')}
          onChange={(event) => {
            onAdd(Array.from(event.target.files ?? []))
            // Allows choosing the same file again after removing it.
            event.target.value = ''
          }}
        />
      </label>

      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

export default GalleryField
