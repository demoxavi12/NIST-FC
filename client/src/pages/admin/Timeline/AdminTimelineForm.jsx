import { AlertCircle, ArrowLeft, Trash2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Button from '../../../components/common/Button'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import ErrorState from '../../../components/common/ErrorState'
import LoadingState from '../../../components/common/LoadingState'
import PhotoField from '../../../components/common/PhotoField'
import SelectField from '../../../components/common/SelectField'
import TextAreaField from '../../../components/common/TextAreaField'
import TextField from '../../../components/common/TextField'
import MemoryPicker from '../../../components/memory/MemoryPicker'
import { MAX_PHOTO_SIZE_MB, PHOTO_ACCEPT } from '../../../constants/players'
import { MAX_YEAR, MIN_YEAR, TIMELINE_CATEGORIES, TIMELINE_FIELD_LIMITS } from '../../../constants/timeline'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import useUnsavedChanges from '../../../hooks/useUnsavedChanges'
import {
  createTimelineEvent,
  getTimelineEventById,
  updateTimelineEvent,
} from '../../../services/timelineService'
import { toDateValue } from '../../../utils/formatDate'
import { validateTimelineForm } from '../../../utils/validateTimelineForm'
import { validatePhoto } from '../../../utils/validatePlayerForm'

const TEXT_FIELDS = ['title', 'year', 'date', 'category', 'description']
// Form order, for moving focus to the first error: [error key, control name].
const FIELD_ORDER = [
  ['title', 'title'],
  ['year', 'year'],
  ['date', 'date'],
  ['category', 'category'],
  ['description', 'description'],
  ['image', 'image'],
  ['memory', 'memory-search'],
]
const EMPTY_VALUES = { title: '', year: '', date: '', category: '', description: '', published: false }

function valuesFrom(event) {
  if (!event) return EMPTY_VALUES
  return {
    title: event.title,
    year: String(event.year),
    date: toDateValue(event.date),
    category: event.category,
    description: event.description,
    published: event.published,
  }
}

/** Field changes compared with the saved event (everything when creating). */
function changedFields(values, memory, event) {
  const trimmed = Object.fromEntries(TEXT_FIELDS.map((field) => [field, values[field].trim()]))
  const memoryId = memory?.id ?? ''
  if (!event) return { ...trimmed, memory: memoryId, published: values.published }

  const saved = valuesFrom(event)
  const changes = Object.fromEntries(
    Object.entries(trimmed).filter(([field, value]) => value !== saved[field]),
  )
  if (memoryId !== (event.memory?.id ?? '')) changes.memory = memoryId
  if (values.published !== event.published) changes.published = values.published
  return changes
}

/**
 * The timeline event form (docs/UI_DESIGN.md §53–§54). New events are placed
 * chronologically by the server; the order is changed on the list page.
 * Editing sends only changed fields plus `expectedUpdatedAt`, so an edit made
 * elsewhere in the meantime is reported (409) instead of overwritten.
 */
function TimelineEventForm({ event }) {
  const navigate = useNavigate()
  const isEdit = Boolean(event)
  const [values, setValues] = useState(() => valuesFrom(event))
  const [memory, setMemory] = useState(() => event?.memory ?? null)
  const [imageFile, setImageFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const changes = changedFields(values, memory, event)
  const dirty = isEdit
    ? Object.keys(changes).length > 0 || Boolean(imageFile) || removeImage
    : TEXT_FIELDS.some((field) => values[field].trim()) ||
      values.published ||
      Boolean(memory) ||
      Boolean(imageFile)
  const { blocker, allowNavigation } = useUnsavedChanges(dirty)

  function focusFirstError(form, fieldErrors) {
    const entry = FIELD_ORDER.find(([field]) => fieldErrors[field])
    form.elements.namedItem(entry?.[1] ?? '')?.focus?.()
  }

  function handleChange(changeEvent) {
    const { name, value, type, checked } = changeEvent.target
    setValues((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value }
      // Picking an exact date fills in its year; typing a year never moves the date.
      if (name === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) next.year = value.slice(0, 4)
      return next
    })
  }

  function handleImageChange(file) {
    setImageFile(file)
    if (file) setRemoveImage(false)
    setErrors((current) => ({ ...current, image: validatePhoto(file) ?? undefined }))
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    if (saving) return
    const form = submitEvent.currentTarget

    const fieldErrors = validateTimelineForm(values, { imageFile })
    setErrors(fieldErrors)
    setFormError(null)
    if (Object.keys(fieldErrors).length > 0) {
      focusFirstError(form, fieldErrors)
      return
    }
    if (isEdit && !dirty) {
      setFormError('No changes to save.')
      return
    }

    const body = new FormData()
    for (const [key, value] of Object.entries(changes)) body.append(key, String(value))
    if (imageFile) body.append('image', imageFile)
    else if (removeImage) body.append('removeImage', 'true')
    if (isEdit) body.append('expectedUpdatedAt', event.updatedAt)

    setSaving(true)
    try {
      const saved = isEdit ? await updateTimelineEvent(event.id, body) : await createTimelineEvent(body)
      allowNavigation()
      navigate('/admin/timeline', {
        state: { flash: isEdit ? `${saved.title} was updated.` : `${saved.title} was added.` },
      })
    } catch (error) {
      setSaving(false)
      if (error.status === 409) {
        setFormError(error.message)
      } else if (error.details && typeof error.details === 'object') {
        setErrors(error.details)
        setFormError(error.details.body ?? 'Please correct the highlighted fields.')
        focusFirstError(form, error.details)
      } else if (error.status === 404) {
        setFormError('This timeline event no longer exists.')
      } else if (error.status === 502) {
        setFormError('The image could not be uploaded. Please try again.')
      } else {
        setFormError(error.status ? error.message : 'Unable to reach the server. Please try again.')
      }
    }
  }

  const currentImage = event?.image && !removeImage ? event.image.url : undefined

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
          maxLength={TIMELINE_FIELD_LIMITS.title}
          autoComplete="off"
          value={values.title}
          onChange={handleChange}
          error={errors.title}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="year"
            label="Year"
            required
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            hint={`${MIN_YEAR}–${MAX_YEAR}`}
            value={values.year}
            onChange={handleChange}
            error={errors.year}
          />
          <TextField
            id="date"
            label="Exact date"
            type="date"
            hint="Optional. Fills in the year."
            value={values.date}
            onChange={handleChange}
            error={errors.date}
          />
        </div>

        <SelectField
          id="category"
          label="Category"
          required
          placeholder="Select a category"
          options={TIMELINE_CATEGORIES}
          value={values.category}
          onChange={handleChange}
          error={errors.category}
        />

        <TextAreaField
          id="description"
          label="Description"
          rows={5}
          maxLength={TIMELINE_FIELD_LIMITS.description}
          value={values.description}
          onChange={handleChange}
          error={errors.description}
        />

        <div>
          <PhotoField
            id="image"
            label="Image"
            aspect="landscape"
            accept={PHOTO_ACCEPT}
            hint={`Optional. JPEG, PNG or WEBP, up to ${MAX_PHOTO_SIZE_MB} MB.`}
            file={imageFile}
            currentUrl={currentImage}
            onChange={handleImageChange}
            error={errors.image}
          />
          {event?.image && !imageFile && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setRemoveImage((value) => !value)}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-muted"
              >
                {removeImage ? (
                  <Undo2 aria-hidden="true" className="size-4" />
                ) : (
                  <Trash2 aria-hidden="true" className="size-4" />
                )}
                {removeImage ? 'Keep current image' : 'Remove image'}
              </button>
              {removeImage && (
                <p role="status" className="text-sm text-ink-muted">
                  The image will be removed when you save.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface p-4 md:p-6">
        <MemoryPicker id="memory" selected={memory} onChange={setMemory} error={errors.memory} />
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
              Published events appear on the public timeline. Unpublished events are drafts that
              only admins can see.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button to="/admin/timeline" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Event'}
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
        Your changes to this timeline event have not been saved and will be lost.
      </ConfirmDialog>
    </form>
  )
}

/**
 * /admin/timeline/new and /admin/timeline/:id/edit. The edit form is
 * rendered once the event has loaded, so its fields start from saved values.
 */
function AdminTimelineForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  usePageMeta({ title: isEdit ? 'Edit Timeline Event' : 'Add Timeline Event', noindex: true })

  const eventRequest = useApiRequest(
    ({ signal }) => (isEdit ? getTimelineEventById(id, { signal }) : Promise.resolve(null)),
    id ?? 'new',
  )

  let content
  if (eventRequest.error?.status === 404) {
    content = <ErrorState title="Timeline event not found." message="This event may have been deleted." />
  } else if (eventRequest.error) {
    content = (
      <ErrorState title="Unable to load this event." message="Please try again." onRetry={eventRequest.reload} />
    )
  } else if (eventRequest.loading) {
    content = (
      <div className="flex justify-center py-16">
        <LoadingState label="Loading event…" />
      </div>
    )
  } else {
    content = <TimelineEventForm key={eventRequest.data?.id ?? 'new'} event={eventRequest.data} />
  }

  return (
    <div>
      <Link
        to="/admin/timeline"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to timeline
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
        {isEdit ? 'Edit Timeline Event' : 'Add Timeline Event'}
      </h1>
      {content}
    </div>
  )
}

export default AdminTimelineForm
