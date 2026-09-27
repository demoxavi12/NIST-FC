import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as memoryService from '../../../services/memoryService'
import * as playerService from '../../../services/playerService'
import AdminMemoryForm from './AdminMemoryForm'

vi.mock('../../../services/memoryService', () => ({
  getMemoryById: vi.fn(),
  createMemory: vi.fn(),
  updateMemory: vi.fn(),
}))
vi.mock('../../../services/playerService', () => ({ listPlayers: vi.fn() }))

const image = (id) => ({ url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`, publicId: id })
const PLAYER = {
  id: '64b000000000000000000001',
  name: 'Test Player',
  photo: image('pl'),
  position: 'Forward',
  batch: '2023-2027',
  status: 'former',
}

const MEMORY = {
  id: 'm1',
  title: 'Inter-College Final',
  slug: 'inter-college-final',
  description: '',
  date: '2025-12-12T00:00:00.000Z',
  location: 'NIST Ground',
  coverImage: image('cover'),
  photos: [image('g1'), image('g2')],
  players: [],
  tags: ['final'],
  published: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function ListProbe() {
  const location = useLocation()
  return <p>List page: {location.state?.flash}</p>
}

function renderForm(entry) {
  const router = createMemoryRouter(
    [
      { path: '/admin/memories', element: <ListProbe /> },
      { path: '/admin/memories/new', element: <AdminMemoryForm /> },
      { path: '/admin/memories/:id/edit', element: <AdminMemoryForm /> },
      { path: '/elsewhere', element: <p>Elsewhere</p> },
    ],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const file = (name = 'photo.jpg', type = 'image/jpeg') => new File(['img'], name, { type })
const field = (label) => screen.getByLabelText(new RegExp(`^${label}`))
const save = () => fireEvent.click(screen.getByRole('button', { name: /Save Memory|Retry remaining photos/ }))
const addPhotos = (count) =>
  fireEvent.change(screen.getByLabelText(/Add photos/), {
    target: { files: Array.from({ length: count }, (_, i) => file(`g${i + 1}.jpg`)) },
  })
const entries = (formData) => Object.fromEntries(formData.entries())

function fillValid() {
  fireEvent.change(field('Title'), { target: { value: '  Inter-College Final ' } })
  fireEvent.change(field('Date'), { target: { value: '2025-12-12' } })
  fireEvent.change(document.getElementById('coverImage'), { target: { files: [file('cover.jpg')] } })
}

// Each successful request returns the memory with a new updatedAt.
function savedMemory(n, extra = {}) {
  return { ...MEMORY, id: 'new1', photos: [], updatedAt: `2026-02-0${n}T00:00:00.000Z`, ...extra }
}

beforeEach(() => {
  vi.clearAllMocks()
  playerService.listPlayers.mockResolvedValue({ players: [PLAYER], pagination: { total: 1 } })
})

describe('Add Memory form', () => {
  it('requires a title, date and cover image before sending', async () => {
    renderForm('/admin/memories/new')
    await screen.findByRole('heading', { level: 1, name: 'Add Memory' })

    save()

    expect(await screen.findByText('Title is required')).toBeTruthy()
    expect(screen.getByText('Date is required')).toBeTruthy()
    expect(screen.getByText('Cover image is required')).toBeTruthy()
    expect(document.activeElement).toBe(field('Title'))
    expect(memoryService.createMemory).not.toHaveBeenCalled()
  })

  it('creates the memory, uploads the gallery 3 photos at a time and publishes last', async () => {
    memoryService.createMemory.mockResolvedValue(savedMemory(1))
    memoryService.updateMemory
      .mockResolvedValueOnce(savedMemory(2))
      .mockResolvedValueOnce(savedMemory(3, { published: true }))
    const router = renderForm('/admin/memories/new')
    await screen.findByRole('heading', { level: 1, name: 'Add Memory' })

    fillValid()
    addPhotos(7)
    fireEvent.click(await screen.findByRole('checkbox', { name: /Test Player/ }))
    fireEvent.change(field('Tags'), { target: { value: 'Final' } })
    fireEvent.keyDown(field('Tags'), { key: 'Enter' })
    fireEvent.click(screen.getByRole('checkbox', { name: /Published/ }))
    save()

    expect(await screen.findByText(/List page: Inter-College Final was added./)).toBeTruthy()
    expect(router.state.location.pathname).toBe('/admin/memories')

    const created = memoryService.createMemory.mock.calls[0][0]
    expect(entries(created)).toMatchObject({
      title: 'Inter-College Final',
      date: '2025-12-12',
      location: '',
      players: JSON.stringify([PLAYER.id]),
      tags: '["final"]',
    })
    expect(created.get('published')).toBeNull()
    expect(created.get('coverImage').name).toBe('cover.jpg')
    expect(created.getAll('photos').map((f) => f.name)).toEqual(['g1.jpg', 'g2.jpg', 'g3.jpg'])

    const [[id2, second], [id3, third]] = memoryService.updateMemory.mock.calls
    expect(id2).toBe('new1')
    expect(second.get('expectedUpdatedAt')).toBe('2026-02-01T00:00:00.000Z')
    expect(second.getAll('photos').map((f) => f.name)).toEqual(['g4.jpg', 'g5.jpg', 'g6.jpg'])
    expect(second.get('published')).toBeNull()
    expect(second.get('title')).toBeNull()
    expect(id3).toBe('new1')
    expect(third.get('expectedUpdatedAt')).toBe('2026-02-02T00:00:00.000Z')
    expect(third.getAll('photos').map((f) => f.name)).toEqual(['g7.jpg'])
    expect(third.get('published')).toBe('true')
  })

  it('keeps the memory when a batch fails and retries only the remaining photos', async () => {
    memoryService.createMemory.mockResolvedValue(savedMemory(1))
    memoryService.updateMemory
      .mockRejectedValueOnce(Object.assign(new Error('Upload failed'), { status: 502 }))
      .mockResolvedValueOnce(savedMemory(2))
    renderForm('/admin/memories/new')
    await screen.findByRole('heading', { level: 1, name: 'Add Memory' })

    fillValid()
    addPhotos(5)
    save()

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('3 of 5 new photos were uploaded and the memory was saved.')
    const newList = screen.getByRole('list', { name: 'New photos to upload' })
    expect(within(newList).getAllByRole('listitem')).toHaveLength(2)

    save() // "Retry remaining photos"
    expect(await screen.findByText(/List page: Inter-College Final was added./)).toBeTruthy()
    expect(memoryService.createMemory).toHaveBeenCalledTimes(1)
    const retry = memoryService.updateMemory.mock.calls[1][1]
    expect(retry.getAll('photos').map((f) => f.name)).toEqual(['g4.jpg', 'g5.jpg'])
    expect(retry.get('title')).toBeNull()
  })

  it('rejects invalid gallery files without adding them', async () => {
    renderForm('/admin/memories/new')
    await screen.findByRole('heading', { level: 1, name: 'Add Memory' })

    fireEvent.change(screen.getByLabelText(/Add photos/), { target: { files: [file('doc.pdf', 'application/pdf')] } })
    expect(screen.getByText(/doc.pdf: Photo must be a JPEG, PNG or WEBP image/)).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'New photos to upload' })).toBeNull()
  })

  it('asks before leaving with unsaved changes', async () => {
    const router = renderForm('/admin/memories/new')
    await screen.findByRole('heading', { level: 1, name: 'Add Memory' })
    fireEvent.change(field('Title'), { target: { value: 'Draft title' } })

    router.navigate('/elsewhere')
    const dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/memories/new'))

    router.navigate('/elsewhere')
    fireEvent.click(await screen.findByRole('button', { name: 'Leave page' }))
    expect(await screen.findByText('Elsewhere')).toBeTruthy()
  })
})

describe('Edit Memory form', () => {
  beforeEach(() => {
    memoryService.getMemoryById.mockResolvedValue(MEMORY)
  })

  it('sends only changed fields, removed photos and the loaded updatedAt', async () => {
    memoryService.updateMemory.mockResolvedValue({ ...MEMORY, location: 'Main Ground' })
    renderForm('/admin/memories/m1/edit')
    await screen.findByDisplayValue('Inter-College Final')

    fireEvent.change(field('Location'), { target: { value: 'Main Ground' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remove saved photo 2' }))
    expect(screen.getByText('Will be removed')).toBeTruthy()
    save()

    expect(await screen.findByText(/List page: Inter-College Final was updated./)).toBeTruthy()
    const [id, body] = memoryService.updateMemory.mock.calls[0]
    expect(id).toBe('m1')
    expect(entries(body)).toEqual({
      location: 'Main Ground',
      removePhotos: '["g2"]',
      expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('offers to retry the remaining photos after a failed batch', async () => {
    memoryService.updateMemory
      .mockResolvedValueOnce({ ...MEMORY, updatedAt: '2026-01-02T00:00:00.000Z' })
      .mockRejectedValueOnce(Object.assign(new Error('Upload failed'), { status: 502 }))
    renderForm('/admin/memories/m1/edit')
    await screen.findByDisplayValue('Inter-College Final')

    addPhotos(4)
    save()

    expect((await screen.findByRole('alert')).textContent).toContain('3 of 4 new photos were uploaded')
    expect(screen.getByRole('button', { name: 'Retry remaining photos' })).toBeTruthy()
    const second = memoryService.updateMemory.mock.calls[1][1]
    expect(second.get('expectedUpdatedAt')).toBe('2026-01-02T00:00:00.000Z')
  })

  it('reports when there is nothing to save', async () => {
    renderForm('/admin/memories/m1/edit')
    await screen.findByDisplayValue('Inter-College Final')
    save()
    expect(await screen.findByText('No changes to save.')).toBeTruthy()
    expect(memoryService.updateMemory).not.toHaveBeenCalled()
  })

  it('explains a conflicting edit', async () => {
    memoryService.updateMemory.mockRejectedValue(
      Object.assign(new Error('This memory was changed by someone else. Reload and try again.'), { status: 409 }),
    )
    renderForm('/admin/memories/m1/edit')
    await screen.findByDisplayValue('Inter-College Final')
    fireEvent.change(field('Title'), { target: { value: 'New title' } })
    save()
    expect((await screen.findByRole('alert')).textContent).toContain('changed by someone else')
  })

  it('shows not found for a missing memory', async () => {
    memoryService.getMemoryById.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }))
    renderForm('/admin/memories/zzz/edit')
    expect(await screen.findByRole('heading', { name: 'Memory not found.' })).toBeTruthy()
  })
})
