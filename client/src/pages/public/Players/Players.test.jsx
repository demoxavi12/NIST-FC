import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as playerService from '../../../services/playerService'
import Players from './Players'

vi.mock('../../../services/playerService', () => ({ listPlayers: vi.fn() }))

const player = (n, overrides = {}) => ({
  id: String(n),
  name: `Test Player ${n}`,
  slug: `test-player-${n}`,
  photo: { url: `https://res.cloudinary.com/demo/image/upload/p${n}.jpg`, publicId: `p${n}` },
  position: 'Defender',
  batch: '2023-2027',
  branch: 'CSE',
  status: 'current',
  ...overrides,
})

function response(players, { page = 1, total = players.length, pages = 1 } = {}) {
  return {
    players,
    pagination: { page, limit: 12, total, pages },
    filters: { batches: ['2024-2028', '2023-2027'], branches: ['CSE', 'ECE'] },
  }
}

function renderPlayers(entry = '/players') {
  const router = createMemoryRouter([{ path: '/players', element: <Players /> }], {
    initialEntries: [entry],
  })
  render(<RouterProvider router={router} />)
  return router
}

const lastParams = () => playerService.listPlayers.mock.calls.at(-1)[0]

beforeEach(() => {
  playerService.listPlayers.mockResolvedValue(response([player(1), player(2)]))
})

describe('Players page', () => {
  it('loads current players by default and shows cards', async () => {
    renderPlayers()

    expect(screen.getByRole('heading', { level: 1, name: 'Our Players' })).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'Test Player 1' })).toBeTruthy()
    expect(lastParams()).toMatchObject({ status: 'current', page: 1, limit: 12, search: '' })
    expect(screen.getByRole('button', { name: 'Current players' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('status').textContent).toBe('2 players found')
    expect(document.title).toBe('Our Players | NIST FC')
  })

  it('reads filters, status and page from the URL', async () => {
    renderPlayers('/players?status=former&position=Forward&batch=2024-2028&branch=ECE&search=raj&page=2')
    await screen.findByRole('link', { name: 'Test Player 1' })

    expect(lastParams()).toMatchObject({
      status: 'former', position: 'Forward', batch: '2024-2028', branch: 'ECE', search: 'raj', page: 2,
    })
  })

  it('ignores unknown values in a hand-edited URL', async () => {
    renderPlayers('/players?status=retired&position=Striker&batch=2023&page=abc')
    await screen.findByRole('link', { name: 'Test Player 1' })

    expect(lastParams()).toMatchObject({ status: 'current', position: '', batch: '', page: 1 })
  })

  it('sends no status for the All tab and resets to page 1 on filter changes', async () => {
    const router = renderPlayers('/players?page=3')
    await screen.findByRole('link', { name: 'Test Player 1' })

    fireEvent.click(screen.getByRole('button', { name: 'All players' }))
    await waitFor(() => expect(lastParams().status).toBe(''))
    expect(router.state.location.search).toBe('?status=all')

    fireEvent.change(screen.getByLabelText('Batch'), { target: { value: '2023-2027' } })
    await waitFor(() => expect(lastParams().batch).toBe('2023-2027'))
    expect(lastParams().page).toBe(1)
  })

  it('offers filter options from the API and clears them', async () => {
    const router = renderPlayers('/players?branch=CSE')
    await screen.findByRole('link', { name: 'Test Player 1' })

    const batch = screen.getByLabelText('Batch')
    expect(within(batch).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'All batches', '2024-2028', '2023-2027',
    ])
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })

  it('searches after typing pauses', async () => {
    renderPlayers()
    await screen.findByRole('link', { name: 'Test Player 1' })

    fireEvent.change(screen.getByLabelText('Search players'), { target: { value: 'das' } })
    await waitFor(() => expect(lastParams().search).toBe('das'), { timeout: 2000 })
  })

  it('shows loading placeholders, then an empty state', async () => {
    let resolve
    playerService.listPlayers.mockImplementation(() => new Promise((r) => (resolve = r)))
    renderPlayers('/players?search=zzz')

    expect(screen.getByRole('status').textContent).toBe('Loading players…')
    await act(async () => resolve(response([])))

    expect(screen.getByRole('heading', { name: 'No players found.' })).toBeTruthy()
    expect(screen.getByText('Try changing your search or filters.')).toBeTruthy()
  })

  it('shows an error with Retry', async () => {
    playerService.listPlayers
      .mockRejectedValueOnce(Object.assign(new Error('fail'), { status: 500 }))
      .mockResolvedValueOnce(response([player(1)]))
    renderPlayers()

    expect(await screen.findByRole('heading', { name: 'Unable to load players.' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: 'Test Player 1' })).toBeTruthy()
  })

  it('paginates with shareable links', async () => {
    playerService.listPlayers.mockResolvedValue(response([player(1)], { page: 1, total: 30, pages: 3 }))
    renderPlayers('/players?status=former')
    await screen.findByRole('link', { name: 'Test Player 1' })

    const next = screen.getByRole('link', { name: /Next/ })
    expect(next.getAttribute('href')).toBe('/players?status=former&page=2')
  })
})
