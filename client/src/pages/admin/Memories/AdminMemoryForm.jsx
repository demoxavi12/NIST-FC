import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Button from '../../../components/common/Button'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import ErrorState from '../../../components/common/ErrorState'
import GalleryField from '../../../components/common/GalleryField'
import LoadingState from '../../../components/common/LoadingState'
import PhotoField from '../../../components/common/PhotoField'
import TagsField from '../../../components/common/TagsField'
import TextAreaField from '../../../components/common/TextAreaField'
import TextField from '../../../components/common/TextField'
import PlayerPicker from '../../../components/player/PlayerPicker'
import {
  MAX_GALLERY_PHOTOS,
  MAX_TAGS,
  MEMORY_FIELD_LIMITS,
  TAG_MAX_LENGTH,
  UPLOAD_BATCH_SIZE,
} from '../../../constants/memories'
import { MAX_PHOTO_SIZE_MB, PHOTO_ACCEPT } from '../../../constants/players'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import useUnsavedChanges from '../../../hooks/useUnsavedChanges'
import { createMemory, getMemoryById, updateMemory } from '../../../services/memoryService'
import { toDateValue } from '../../../utils/formatDate'
import { validateMemoryForm } from '../../../utils/validateMemoryForm'
import { validatePhoto } from '../../../utils/validatePlayerForm'

const TEXT_FIELDS = ['title', 'date', 'location', 'description']
// Form order, for moving focus to the first error. Values are form control names.
const FIELD_ORDER = [
  ['title', 'title'],
  ['date', 'date'],
  ['location', 'location'],
  ['description', 'description'],
  ['coverImage', 'coverImage'],
  ['photos', 'photos'],
  ['removePhotos', 'photos'],
  ['players', 'players-search'],
  ['tags', 'tags'],
]
const EMPTY_VALUES = { title: '', date: '', location: '', description: '', published: false }

let nextPhotoKey = 0

function valuesFrom(memory) {
  if (!memory) return EMPTY_VALUES
  return {
    title: memory.title,
    date: toDateValue(memory.date),
    location: memory.location,
    description: memory.description,
    published: memory.published,
  }
}

const sameIds = (a, b) =>
  a.length === b.length && a.every((player) => b.some((other) => other.id === player.id))
const sameList = (a, b) => a.length === b.length && a.every((value, index) => value === b[index])

/** Field changes compared with the saved memory (everything when creating). */
function changedFields(values, players, tags, memory) {
  const trimmed = Object.fromEntries(TEXT_FIELDS.map((field) => [field, values[field].trim()]))
  if (!memory) return { ...trimmed, players: players.map((p) => p.id), tags }

  const saved = valuesFrom(memory)
  const changes = Object.fromEntries(
    Object.entries(trimmed).filter(([field, value]) => value !== saved[field]),
  )
  if (!sameIds(players, memory.players)) changes.players = players.map((p) => p.id)
  if (!sameList(tags, memory.tags)) changes.tags = tags
  return changes
}

function toFormData(fields) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue
    if (value instanceof File) formData.append(key, value)
    else if (Array.isArray(value)) formData.append(key, JSON.stringify(value))
    else formData.append(key, String(value))
  }
  return formData
}

function chunk(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

/**
 * The memory form (docs/FEATURES.md, UI_DESIGN §51–§56). New gallery photos
 * are uploaded UPLOAD_BATCH_SIZE at a time: the first request carries the
 * fields (and creates the memory), later requests append photos. Publishing
 * is sent with the last request, so a memory is never public with half its
 * gallery. If a batch fails, the memory is kept and the remaining photos can
 * be retried. Every request after the first sends `expectedUpdatedAt`, so
 * edits made elsewhere in the meantime are detected (409).
 */
function MemoryForm({ initialMemory }) {
  const navigate = useNavigate()
  // The saved memory: set when editing, and once a new memory is created.
  const [memory, setMemory] = useState(initialMemory)
  const [values, setValues] = useState(() => valuesFrom(initialMemory))
  const [players, setPlayers] = useState(() => initialMemory?.players ?? [])
  const [tags, setTags] = useState(() => initialMemory?.tags ?? [])
  const [cover, setCover] = useState(null)
  const [newPhotos, setNewPhotos] = useState([])
  const [removedIds, setRemovedIds] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(null) // { label, value, max }
  // Set when some photos were saved but a later batch failed.
  const [partialFailure, setPartialFailure] = useState(false)

  // Release preview URLs of photos still listed when the form unmounts.
  const newPhotosRef = useRef(newPhotos)
  useEffect(() => {
    newPhotosRef.current = newPhotos
  })
  useEffect(
    () => () => newPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)),
    [],
  )

  const fieldChanges = changedFields(values, players, tags, memory)
  const publishChanged = memory ? values.published !== memory.published : values.published
  const dirty =
    (memory
      ? Object.keys(fieldChanges).length > 0
      : TEXT_FIELDS.some((field) => values[field].trim()) || players.length > 0 || tags.length > 0) ||
    publishChanged ||
    Boolean(cover) ||
    newPhotos.length > 0 ||
    removedIds.length > 0
  const { blocker, allowNavigation } = useUnsavedChanges(dirty)

  const existingPhotos = memory?.photos ?? []
  const galleryCount = existingPhotos.length - removedIds.length + newPhotos.length
  const retrying = partialFailure && newPhotos.length > 0

  function focusFirstError(form, fieldErrors) {
    const entry = FIELD_ORDER.find(([field]) => fieldErrors[field])
    form.elements.namedItem(entry?.[1] ?? '')?.focus?.()
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleCoverChange(file) {
    setCover(file)
    setErrors((current) => ({ ...current, coverImage: validatePhoto(file) ?? undefined }))
  }

  function handleAddPhotos(files) {
    const problems = []
    const accepted = []
    const room = MAX_GALLERY_PHOTOS - galleryCount
    for (const file of files) {
      const problem = validatePhoto(file)
      if (problem) problems.push(`${file.name}: ${problem}`)
      else if (accepted.length >= room) {
        problems.push(`A memory can have at most ${MAX_GALLERY_PHOTOS} photos; ${file.name} was not added`)
      } else accepted.push(file)
    }
    setNewPhotos((current) => [
      ...current,
      ...accepted.map((file) => ({ key: nextPhotoKey++, file, previewUrl: URL.createObjectURL(file) })),
    ])
    setErrors((current) => ({ ...current, photos: problems.length ? problems.join('. ') : undefined }))
  }

  function handleRemoveNew(key) {
    setNewPhotos((current) => {
      const photo = current.find((item) => item.key === key)
      if (photo) URL.revokeObjectURL(photo.previewUrl)
      return current.filter((item) => item.key !== key)
    })
  }

  function handleToggleRemove(publicId) {
    setRemovedIds((current) =>
      current.includes(publicId) ? current.filter((id) => id !== publicId) : [...current, publicId],
    )
  }

  /** Called after each successful request with the saved memory. */
  function applySaved(saved, uploadedKeys) {
    setMemory(saved)
    setCover(null)
    setRemovedIds([])
    setNewPhotos((current) => {
      for (const photo of current) {
        if (uploadedKeys.includes(photo.key)) URL.revokeObjectURL(photo.previewUrl)
      }
      return current.filter((photo) => !uploadedKeys.includes(photo.key))
    })
  }

  function showSaveError(error, form, { saved, uploaded, total }) {
    if (error.status === 409) {
      setFormError(error.message)
    } else if (error.details && typeof error.details === 'object') {
      setErrors(error.details)
      setFormError(error.details.body ?? 'Please correct the highlighted fields.')
      focusFirstError(form, error.details)
    } else if (error.status === 404) {
      setFormError('This memory no longer exists.')
    } else if (error.status === 502) {
      setFormError('The images could not be uploaded. Please try again.')
    } else {
      setFormError(error.status ? error.message : 'Unable to reach the server. Please try again.')
    }

    // Some requests succeeded: explain what was saved.
    if (saved && total > 0 && uploaded < total) {
      setPartialFailure(true)
      setFormError(
        (message) =>
          `${message} ${uploaded} of ${total} new photos were uploaded and the memory was saved. ` +
          'Use "Retry remaining photos" to upload the rest.',
      )
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget

    const fieldErrors = validateMemoryForm(values, {
      coverFile: cover,
      requireCover: !memory,
      galleryCount,
    })
    setErrors(fieldErrors)
    setFormError(null)
    if (Object.keys(fieldErrors).length > 0) {
      focusFirstError(form, fieldErrors)
      return
    }

    // Build the request sequence: fields first, photos in batches, publishing last.
    const batches = chunk(newPhotos, UPLOAD_BATCH_SIZE)
    const steps = (batches.length > 0 ? batches : [[]]).map((batch) => ({ batch, fields: {} }))
    Object.assign(steps[0].fields, fieldChanges, {
      coverImage: cover ?? undefined,
      removePhotos: removedIds.length > 0 ? removedIds : undefined,
    })
    if (publishChanged) steps[steps.length - 1].fields.published = values.published

    const isEmpty = (step) =>
      step.batch.length === 0 && Object.values(step.fields).every((value) => value === undefined)
    if (memory && isEmpty(steps[0]) && steps.length === 1) {
      setFormError('No changes to save.')
      return
    }

    setSaving(true)
    const total = newPhotos.length
    let current = memory
    let uploaded = 0
    let saved = false

    try {
      for (const step of steps) {
        const first = uploaded + 1
        const last = uploaded + step.batch.length
        const photoRange =
          step.batch.length === 0
            ? 'Saving memory…'
            : first === last
              ? `Uploading photo ${first} of ${total}…`
              : `Uploading photos ${first}–${last} of ${total}…`
        setProgress({ label: photoRange, value: uploaded, max: Math.max(total, 1) })

        const body = toFormData({
          ...step.fields,
          ...(current ? { expectedUpdatedAt: current.updatedAt } : {}),
        })
        for (const photo of step.batch) body.append('photos', photo.file)

        current = current
          ? await updateMemory(current.id, body)
          : await createMemory(body)
        saved = true
        uploaded += step.batch.length
        applySaved(
          current,
          step.batch.map((photo) => photo.key),
        )
      }
    } catch (error) {
      setSaving(false)
      setProgress(null)
      showSaveError(error, form, { saved, uploaded, total })
      return
    }

    allowNavigation()
    navigate('/admin/memories', {
      state: { flash: initialMemory ? `${current.title} was updated.` : `${current.title} was added.` },
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 flex max-w-3xl flex-col gap-6">
      {formError && (
        <p
          role="alert"
          className="flex gap-2 rounded-sm border border-danger bg-surface px-4 py-3 text-sm font-medium text-danger"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-6 rounded-md border border-border bg-surface p-4 md:p-6">
        <TextField
          id="title"
          label="Title"
          required
          maxLength={MEMORY_FIELD_LIMITS.title}
          autoComplete="off"
          value={values.title}
          onChange={handleChange}
          error={errors.title}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="date"
            label="Date"
            type="date"
            required
            value={values.date}
            onChange={handleChange}
            error={errors.date}
          />
          <TextField
            id="location"
            label="Location"
            maxLength={MEMORY_FIELD_LIMITS.location}
            autoComplete="off"
            value={values.location}
            onChange={handleChange}
            error={errors.location}
          />
        </div>

        <TextAreaField
          id="description"
          label="Description"
          rows={6}
          maxLength={MEMORY_FIELD_LIMITS.description}
          value={values.description}
          onChange={handleChange}
          error={errors.description}
        />

        <PhotoField
          id="coverImage"
          label="Cover image"
          aspect="landscape"
          required={!memory}
          accept={PHOTO_ACCEPT}
          hint={`JPEG, PNG or WEBP, up to ${MAX_PHOTO_SIZE_MB} MB. A landscape photo works best. The cover is not part of the gallery.`}
          file={cover}
          currentUrl={memory?.coverImage.url}
          onChange={handleCoverChange}
          error={errors.coverImage}
        />
      </div>

      <div className="rounded-md border border-border bg-surface p-4 md:p-6">
        <GalleryField
          id="photos"
          existingPhotos={existingPhotos}
          removedIds={removedIds}
          onToggleRemove={handleToggleRemove}
          newPhotos={newPhotos}
          onAdd={handleAddPhotos}
          onRemoveNew={handleRemoveNew}
          maxPhotos={MAX_GALLERY_PHOTOS}
          accept={PHOTO_ACCEPT}
          hint={`JPEG, PNG or WEBP, up to ${MAX_PHOTO_SIZE_MB} MB each. Photos appear in the order they are added.`}
          error={errors.photos ?? errors.removePhotos}
        />
      </div>

      <div className="flex flex-col gap-6 rounded-md border border-border bg-surface p-4 md:p-6">
        <PlayerPicker id="players" selected={players} onChange={setPlayers} error={errors.players} />
        <TagsField
          id="tags"
          label="Tags"
          tags={tags}
          onChange={setTags}
          maxTags={MAX_TAGS}
          maxLength={TAG_MAX_LENGTH}
          error={errors.tags}
        />
      </div>

      <div className="rounded-md border border-border bg-surface p-4 md:p-6">
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="published"
            checked={values.published}
            onChange={handleChange}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">Published</span>
            <span className="block text-sm text-ink-muted">
              Published memories are visible on the public site. Unpublished memories are drafts
              that only admins can see.
            </span>
          </span>
        </label>
      </div>

      {progress && (
        <div>
          <label htmlFor="upload-progress" className="text-sm font-medium text-ink">
            {progress.label}
          </label>
          <progress
            id="upload-progress"
            max={progress.max}
            value={progress.value}
            className="mt-2 block h-2 w-full accent-accent"
          />
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button to="/admin/memories" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : retrying ? 'Retry remaining photos' : 'Save Memory'}
        </Button>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        confirmLabel="Leave page"
        confirmVariant="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Your changes to this memory have not been saved and will be lost.
      </ConfirmDialog>
    </form>
  )
}

/**
 * /admin/memories/new and /admin/memories/:id/edit. The edit form is
 * rendered once the memory has loaded, so its fields start from saved values.
 */
function AdminMemoryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  usePageMeta({ title: isEdit ? 'Edit Memory' : 'Add Memory', noindex: true })

  const memoryRequest = useApiRequest(
    ({ signal }) => (isEdit ? getMemoryById(id, { signal }) : Promise.resolve(null)),
    id ?? 'new',
  )

  let content
  if (memoryRequest.error?.status === 404) {
    content = <ErrorState title="Memory not found." message="This memory may have been deleted." />
  } else if (memoryRequest.error) {
    content = (
      <ErrorState title="Unable to load this memory." message="Please try again." onRetry={memoryRequest.reload} />
    )
  } else if (memoryRequest.loading) {
    content = (
      <div className="flex justify-center py-16">
        <LoadingState label="Loading memory…" />
      </div>
    )
  } else {
    content = <MemoryForm key={memoryRequest.data?.id ?? 'new'} initialMemory={memoryRequest.data} />
  }

  return (
    <div>
      <Link
        to="/admin/memories"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to memories
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{isEdit ? 'Edit Memory' : 'Add Memory'}</h1>
      {content}
    </div>
  )
}

export default AdminMemoryForm
