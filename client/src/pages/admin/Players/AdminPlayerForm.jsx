import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Button from '../../../components/common/Button'
import ErrorState from '../../../components/common/ErrorState'
import LoadingState from '../../../components/common/LoadingState'
import PhotoField from '../../../components/common/PhotoField'
import SelectField from '../../../components/common/SelectField'
import TextAreaField from '../../../components/common/TextAreaField'
import TextField from '../../../components/common/TextField'
import {
  BATCH_EXAMPLE,
  MAX_PHOTO_SIZE_MB,
  PHOTO_ACCEPT,
  PLAYER_FIELD_LIMITS,
  PLAYER_POSITIONS,
  PLAYER_STATUS_LABELS,
} from '../../../constants/players'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import {
  createPlayer,
  getPlayerById,
  listPlayers,
  updatePlayer,
} from '../../../services/playerService'
import { validatePhoto, validatePlayerForm } from '../../../utils/validatePlayerForm'

const TEXT_FIELDS = ['name', 'position', 'batch', 'branch', 'bio', 'status']
const FIELD_ORDER = ['name', 'photo', 'position', 'batch', 'branch', 'bio', 'status']
const POSITION_OPTIONS = PLAYER_POSITIONS.map((value) => ({ value, label: value }))

const EMPTY_VALUES = { name: '', position: '', batch: '', branch: '', bio: '', status: 'current' }

function valuesFrom(player) {
  if (!player) return EMPTY_VALUES
  return Object.fromEntries(TEXT_FIELDS.map((field) => [field, player[field] ?? '']))
}

/** The fields whose trimmed value differs from the saved player. */
function changedFields(values, player) {
  return Object.fromEntries(
    TEXT_FIELDS.map((field) => [field, values[field].trim()]).filter(
      ([field, value]) => value !== (player[field] ?? ''),
    ),
  )
}

/**
 * The player form (docs/FEATURES.md §20, UI_DESIGN §51, §56). `player` is set
 * when editing; only changed fields (and a new photo, if chosen) are sent.
 */
function PlayerForm({ player, branchSuggestions }) {
  const navigate = useNavigate()
  const isEdit = Boolean(player)

  const [values, setValues] = useState(() => valuesFrom(player))
  const [photo, setPhoto] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(null)
  // Moves focus to the first field with an error, in form order.
  function focusFirstError(form, fieldErrors) {
    const first = FIELD_ORDER.find((field) => fieldErrors[field])
    const element = first && form.elements.namedItem(first)
    // A radio group is a list; focus its first option.
    const target = element?.focus ? element : element?.[0]
    target?.focus()
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handlePhotoChange(file) {
    setPhoto(file)
    setErrors((current) => ({ ...current, photo: validatePhoto(file) ?? undefined }))
  }

  function buildRequestBody() {
    const fields = isEdit
      ? changedFields(values, player)
      : Object.fromEntries(TEXT_FIELDS.map((field) => [field, values[field].trim()]))

    if (!photo) return Object.keys(fields).length > 0 ? fields : null

    const formData = new FormData()
    for (const [field, value] of Object.entries(fields)) formData.append(field, value)
    formData.append('photo', photo)
    return formData
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget

    const fieldErrors = validatePlayerForm(values, { photo, requirePhoto: !isEdit })
    setErrors(fieldErrors)
    setFormError(null)
    if (Object.keys(fieldErrors).length > 0) {
      focusFirstError(form, fieldErrors)
      return
    }

    const body = buildRequestBody()
    if (!body) {
      setFormError('No changes to save.')
      return
    }

    setSaving(true)
    const onUploadProgress = photo
      ? (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100))
          }
        }
      : undefined

    try {
      const saved = isEdit
        ? await updatePlayer(player.id, body, { onUploadProgress })
        : await createPlayer(body, { onUploadProgress })
      navigate('/admin/players', {
        state: {
          flash: isEdit ? `${saved.name} was updated.` : `${saved.name} was added.`,
        },
      })
    } catch (error) {
      setSaving(false)
      setProgress(null)
      if (error.details && typeof error.details === 'object') {
        setErrors(error.details)
        if (error.details.body) setFormError(error.details.body)
        focusFirstError(form, error.details)
      } else if (error.status === 404) {
        setFormError('This player no longer exists.')
      } else if (error.status === 502) {
        setFormError('The photo could not be uploaded. Please try again.')
      } else {
        setFormError(
          error.status ? error.message : 'Unable to reach the server. Please try again.',
        )
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-6">
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
          id="name"
          label="Name"
          required
          maxLength={PLAYER_FIELD_LIMITS.name}
          autoComplete="off"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
        />

        <PhotoField
          id="photo"
          label="Photo"
          required={!isEdit}
          accept={PHOTO_ACCEPT}
          hint={`JPEG, PNG or WEBP, up to ${MAX_PHOTO_SIZE_MB} MB. A portrait photo works best.`}
          file={photo}
          currentUrl={player?.photo.url}
          onChange={handlePhotoChange}
          error={errors.photo}
        />

        <SelectField
          id="position"
          label="Position"
          required
          placeholder="Select a position"
          options={POSITION_OPTIONS}
          value={values.position}
          onChange={handleChange}
          error={errors.position}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="batch"
            label="Batch"
            required
            hint={`Academic batch range, e.g. ${BATCH_EXAMPLE}`}
            inputMode="numeric"
            autoComplete="off"
            maxLength={9}
            value={values.batch}
            onChange={handleChange}
            error={errors.batch}
          />
          <TextField
            id="branch"
            label="Branch"
            required
            hint="e.g. CSE"
            list="branch-suggestions"
            autoComplete="off"
            maxLength={PLAYER_FIELD_LIMITS.branch}
            value={values.branch}
            onChange={handleChange}
            error={errors.branch}
          />
          <datalist id="branch-suggestions">
            {branchSuggestions.map((branch) => (
              <option key={branch} value={branch} />
            ))}
          </datalist>
        </div>

        <TextAreaField
          id="bio"
          label="Bio"
          maxLength={PLAYER_FIELD_LIMITS.bio}
          value={values.bio}
          onChange={handleChange}
          error={errors.bio}
        />

        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            Status <span className="ml-1 font-normal text-ink-muted">(required)</span>
          </legend>
          <p className="mt-1 text-sm text-ink-muted">
            Players who leave the team become former players and stay in the archive.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(PLAYER_STATUS_LABELS).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-border px-4 text-sm font-semibold text-ink has-[:checked]:border-primary"
              >
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={values.status === value}
                  onChange={handleChange}
                  className="size-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {progress !== null && (
        <div>
          <label htmlFor="upload-progress" className="text-sm font-medium text-ink">
            Uploading photo… {progress}%
          </label>
          <progress id="upload-progress" max="100" value={progress} className="mt-2 block h-2 w-full accent-accent" />
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button to="/admin/players" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Player'}
        </Button>
      </div>
    </form>
  )
}

/**
 * /admin/players/new and /admin/players/:id/edit. The edit form is rendered
 * only once the player has loaded, so its fields start from saved values.
 */
function AdminPlayerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  usePageMeta({ title: isEdit ? 'Edit Player' : 'Add Player', noindex: true })

  const playerRequest = useApiRequest(
    ({ signal }) => (isEdit ? getPlayerById(id, { signal }) : Promise.resolve(null)),
    id ?? 'new',
  )
  // Existing branch names, suggested to keep spellings consistent.
  const optionsRequest = useApiRequest(
    ({ signal }) => listPlayers({ limit: 1 }, { signal }),
    'player-filter-options',
  )
  const branchSuggestions = optionsRequest.data?.filters?.branches ?? []

  let content
  if (playerRequest.error?.status === 404) {
    content = (
      <ErrorState title="Player not found." message="This player may have been deleted." />
    )
  } else if (playerRequest.error) {
    content = (
      <ErrorState title="Unable to load this player." message="Please try again." onRetry={playerRequest.reload} />
    )
  } else if (playerRequest.loading) {
    content = (
      <div className="flex justify-center py-16">
        <LoadingState label="Loading player…" />
      </div>
    )
  } else {
    content = (
      <PlayerForm
        key={playerRequest.data?.id ?? 'new'}
        player={playerRequest.data}
        branchSuggestions={branchSuggestions}
      />
    )
  }

  return (
    <div>
      <Link
        to="/admin/players"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to players
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
        {isEdit ? 'Edit Player' : 'Add Player'}
      </h1>
      {content}
    </div>
  )
}

export default AdminPlayerForm
