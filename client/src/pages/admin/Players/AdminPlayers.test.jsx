import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as playerService from '../../../services/playerService'
import AdminPlayers from './AdminPlayers'

vi.mock('../../../services/playerService', () => ({
  listPlayers: vi.fn(),
  updatePlayer: vi.fn(),
  deletePlayer: vi.fn(),
}))

const PLAYER = {
  id: 'p1',
  name: 'Test Player',
  slug: 'test-player',
  photo: { url: 'https://res.cloudinary.com/demo/image/upload/p.jpg', publicId: 'p' },
  position: 'Forward',
  batch: '2023-2027',
  branch: 'CSE',
  status: 'current',
}

const listOf = (players) => ({
  players,
  pagination: { page: 1, limit: 20, total: players.length, pages: 1 },
  filters: { batches: [], branches: [] },
})

function renderPage(entry = '/admin/players') {
  const router = createMemoryRouter([{ path: '/admin/players', element: <AdminPlayers /> }], {
    initialEntries: [entry],
  })
  render(<RouterProvider router={router} />)
  return router
}

// The table (desktop) and cards (mobile) both render in jsdom; use the table.
const table = () => screen.getByRole('table', { name: 'Players' })

beforeEach(() => {
  playerService.listPlayers.mockResolvedValue(listOf([PLAYER]))
})

describe('AdminPlayers', () => {
  it('lists players in an accessible table', async () => {
    renderPage()
    await screen.findByRole('table', { name: 'Players' })

    const row = within(table()).getByRole('row', { name: /Test Player/ })
    expect(within(row).getByText('Forward')).toBeTruthy()
    expect(within(row).getByText('2023-2027')).toBeTruthy()
    expect(within(row).getByRole('link', { name: 'Edit Test Player' }).getAttribute('href')).toBe(
      '/admin/players/p1/edit',
    )
    expect(playerService.listPlayers.mock.calls[0][0]).toMatchObject({ limit: 20, page: 1, status: '' })
  })

  it('shows the add-player empty state when there are no players', async () => {
    playerService.listPlayers.mockResolvedValue(listOf([]))
    renderPage()

    expect(await screen.findByRole('heading', { name: 'No players added yet.' })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Add Player' }).length).toBeGreaterThan(0)
  })

  it('marks a player as former after confirmation', async () => {
    playerService.updatePlayer.mockResolvedValue({ ...PLAYER, status: 'former' })
    renderPage()
    await screen.findByRole('table', { name: 'Players' })

    fireEvent.click(within(table()).getByRole('button', { name: 'Mark Test Player as former' }))
    const dialog = screen.getByRole('dialog', { name: 'Mark player as former?' })
    expect(dialog.textContent).toContain('will remain in the historical archive')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark as former' }))

    await waitFor(() =>
      expect(playerService.updatePlayer).toHaveBeenCalledWith('p1', { status: 'former' }),
    )
    expect((await screen.findByRole('status')).textContent).toContain('Test Player was marked as former.')
    expect(playerService.listPlayers).toHaveBeenCalledTimes(2)
    expect(playerService.deletePlayer).not.toHaveBeenCalled()
  })

  it('deletes only after a separate, destructive confirmation', async () => {
    playerService.deletePlayer.mockResolvedValue()
    renderPage()
    await screen.findByRole('table', { name: 'Players' })

    fireEvent.click(within(table()).getByRole('button', { name: 'Delete Test Player' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete player?' })
    expect(dialog.textContent).toContain('permanently remove Test Player and their photo')
    expect(dialog.textContent).toContain('mark them as former instead')
    // Cancel is focused first, so the destructive action is never the default.
    expect(document.activeElement.textContent).toBe('Cancel')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))
    await waitFor(() => expect(playerService.deletePlayer).toHaveBeenCalledWith('p1'))
    expect((await screen.findByRole('status')).textContent).toContain('Test Player was deleted.')
  })

  it('does nothing when the confirmation is cancelled', async () => {
    renderPage()
    await screen.findByRole('table', { name: 'Players' })

    fireEvent.click(within(table()).getByRole('button', { name: 'Delete Test Player' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(playerService.deletePlayer).not.toHaveBeenCalled()
  })

  it('shows an error inside the dialog when the action fails', async () => {
    playerService.deletePlayer.mockRejectedValue(Object.assign(new Error('Server error'), { status: 500 }))
    renderPage()
    await screen.findByRole('table', { name: 'Players' })

    fireEvent.click(within(table()).getByRole('button', { name: 'Delete Test Player' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete permanently' }))

    expect((await within(screen.getByRole('dialog')).findByRole('alert')).textContent).toBe('Server error')
  })

  it('shows the success message passed from the form', async () => {
    const router = createMemoryRouter([{ path: '/admin/players', element: <AdminPlayers /> }], {
      initialEntries: [{ pathname: '/admin/players', state: { flash: 'Test Player was added.' } }],
    })
    render(<RouterProvider router={router} />)

    expect((await screen.findByRole('status')).textContent).toContain('Test Player was added.')
    await waitFor(() => expect(router.state.location.state).toBeNull())
  })

  it('filters by status through the URL', async () => {
    const router = renderPage()
    await screen.findByRole('table', { name: 'Players' })

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'former' } })
    await waitFor(() => expect(playerService.listPlayers.mock.calls.at(-1)[0].status).toBe('former'))
    expect(router.state.location.search).toBe('?status=former')
  })
})
