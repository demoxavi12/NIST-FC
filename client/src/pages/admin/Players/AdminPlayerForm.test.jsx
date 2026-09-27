import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as playerService from '../../../services/playerService'
import AdminPlayerForm from './AdminPlayerForm'

vi.mock('../../../services/playerService', () => ({
  getPlayerById: vi.fn(),
  listPlayers: vi.fn(),
  createPlayer: vi.fn(),
  updatePlayer: vi.fn(),
}))

const PLAYER = {
  id: 'p1',
  name: 'Test Player',
  slug: 'test-player',
  photo: { url: 'https://res.cloudinary.com/demo/image/upload/p.jpg', publicId: 'p' },
  position: 'Forward',
  batch: '2023-2027',
  branch: 'CSE',
  bio: '',
  status: 'current',
}

function ListProbe() {
  const location = useLocation()
  return <p>List page: {location.state?.flash}</p>
}

function renderForm(entry) {
  const router = createMemoryRouter(
    [
      { path: '/admin/players', element: <ListProbe /> },
      { path: '/admin/players/new', element: <AdminPlayerForm /> },
      { path: '/admin/players/:id/edit', element: <AdminPlayerForm /> },
    ],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const photoFile = (name = 'photo.jpg', type = 'image/jpeg') => new File(['img'], name, { type })
const field = (label) => screen.getByLabelText(new RegExp(`^${label}`))
const save = () => fireEvent.click(screen.getByRole('button', { name: /Save Player|Saving/ }))

function fillValid() {
  fireEvent.change(field('Name'), { target: { value: '  Test Player ' } })
  fireEvent.change(field('Position'), { target: { value: 'Forward' } })
  fireEvent.change(field('Batch'), { target: { value: '2023-2027' } })
  fireEvent.change(field('Branch'), { target: { value: 'CSE' } })
  fireEvent.change(field('Photo'), { target: { files: [photoFile()] } })
}

beforeEach(() => {
  playerService.listPlayers.mockResolvedValue({
    players: [],
    pagination: {},
    filters: { batches: [], branches: ['CSE', 'ECE'] },
  })
})

describe('Add Player form', () => {
  it('validates required fields, including the photo, before sending', async () => {
    renderForm('/admin/players/new')
    await screen.findByRole('heading', { level: 1, name: 'Add Player' })

    save()

    expect(await screen.findByText('Name is required')).toBeTruthy()
    expect(screen.getByText('Photo is required')).toBeTruthy()
    expect(screen.getByText('Position is required')).toBeTruthy()
    expect(screen.getByText('Batch is required')).toBeTruthy()
    expect(screen.getByText('Branch is required')).toBeTruthy()
    expect(field('Name').getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(field('Name'))
    expect(playerService.createPlayer).not.toHaveBeenCalled()
  })

  it('rejects an invalid batch range', async () => {
    renderForm('/admin/players/new')
    await screen.findByRole('heading', { name: 'Add Player' })
    fillValid()
    fireEvent.change(field('Batch'), { target: { value: '2027-2023' } })

    save()

    expect(await screen.findByText('The second batch year must be after the first')).toBeTruthy()
    expect(document.activeElement).toBe(field('Batch'))
  })

  it('previews the chosen photo and rejects unsupported types', async () => {
    renderForm('/admin/players/new')
    await screen.findByRole('heading', { name: 'Add Player' })

    fireEvent.change(field('Photo'), { target: { files: [photoFile('p.gif', 'image/gif')] } })
    expect(screen.getByText('Photo must be a JPEG, PNG or WEBP image')).toBeTruthy()

    fireEvent.change(field('Photo'), { target: { files: [photoFile()] } })
    expect(screen.getByRole('img', { name: 'Preview of the new photo' })).toBeTruthy()
    expect(screen.queryByText('Photo must be a JPEG, PNG or WEBP image')).toBeNull()
  })

  it('sends every field and the photo, then returns to the list with a message', async () => {
    playerService.createPlayer.mockResolvedValue({ ...PLAYER, name: 'Test Player' })
    renderForm('/admin/players/new')
    await screen.findByRole('heading', { name: 'Add Player' })
    fillValid()

    save()

    expect(await screen.findByText('List page: Test Player was added.')).toBeTruthy()
    const [formData, options] = playerService.createPlayer.mock.calls[0]
    expect(Object.fromEntries([...formData.entries()].filter(([key]) => key !== 'photo'))).toEqual({
      name: 'Test Player',
      position: 'Forward',
      batch: '2023-2027',
      branch: 'CSE',
      bio: '',
      status: 'current',
    })
    expect(formData.get('photo').name).toBe('photo.jpg')
    expect(typeof options.onUploadProgress).toBe('function')
  })

  it('shows server field errors next to the fields', async () => {
    playerService.createPlayer.mockRejectedValue(
      Object.assign(new Error('Validation failed'), { status: 400, details: { branch: 'Branch is required' } }),
    )
    renderForm('/admin/players/new')
    await screen.findByRole('heading', { name: 'Add Player' })
    fillValid()

    save()

    expect(await screen.findByText('Branch is required')).toBeTruthy()
    expect(document.activeElement).toBe(field('Branch'))
  })

  it('explains a failed photo upload', async () => {
    playerService.createPlayer.mockRejectedValue(
      Object.assign(new Error('Image upload failed'), { status: 502, details: null }),
    )
    renderForm('/admin/players/new')
    await screen.findByRole('heading', { name: 'Add Player' })
    fillValid()

    save()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'The photo could not be uploaded. Please try again.',
    )
    expect(screen.getByRole('button', { name: 'Save Player' }).disabled).toBe(false)
  })
})

describe('Edit Player form', () => {
  beforeEach(() => {
    playerService.getPlayerById.mockResolvedValue(PLAYER)
  })

  it('loads the player and sends only changed fields as JSON', async () => {
    playerService.updatePlayer.mockResolvedValue({ ...PLAYER, status: 'former' })
    renderForm('/admin/players/p1/edit')

    expect(await screen.findByDisplayValue('Test Player')).toBeTruthy()
    expect(playerService.getPlayerById.mock.calls[0][0]).toBe('p1')
    expect(screen.getByRole('img', { name: 'Current photo' })).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Former'))
    save()

    expect(await screen.findByText('List page: Test Player was updated.')).toBeTruthy()
    const [id, body] = playerService.updatePlayer.mock.calls[0]
    expect(id).toBe('p1')
    expect(body).toEqual({ status: 'former' })
  })

  it('sends a new photo as multipart form data', async () => {
    playerService.updatePlayer.mockResolvedValue(PLAYER)
    renderForm('/admin/players/p1/edit')
    await screen.findByDisplayValue('Test Player')

    fireEvent.change(field('Photo'), { target: { files: [photoFile('new.png', 'image/png')] } })
    save()

    await waitFor(() => expect(playerService.updatePlayer).toHaveBeenCalled())
    const body = playerService.updatePlayer.mock.calls[0][1]
    expect(body).toBeInstanceOf(FormData)
    expect([...body.keys()]).toEqual(['photo'])
  })

  it('does not send a request when nothing changed', async () => {
    renderForm('/admin/players/p1/edit')
    await screen.findByDisplayValue('Test Player')

    save()

    expect((await screen.findByRole('alert')).textContent).toBe('No changes to save.')
    expect(playerService.updatePlayer).not.toHaveBeenCalled()
  })

  it('shows "Player not found" for an unknown id', async () => {
    playerService.getPlayerById.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }))
    renderForm('/admin/players/missing/edit')

    expect(await screen.findByRole('heading', { name: 'Player not found.' })).toBeTruthy()
  })
})
