import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import * as playerService from '../../../services/playerService'
import PlayerProfile from './PlayerProfile'

vi.mock('../../../services/playerService', () => ({ getPlayerBySlug: vi.fn() }))

const PLAYER = {
  id: '1',
  name: 'Test Player',
  slug: 'test-player',
  photo: { url: 'https://res.cloudinary.com/demo/image/upload/p.jpg', publicId: 'p' },
  position: 'Goalkeeper',
  batch: '2024-2028',
  branch: 'ECE',
  bio: 'First line.\nSecond line <b>not bold</b>.',
  status: 'current',
}

function renderProfile(slug = 'test-player') {
  const router = createMemoryRouter([{ path: '/players/:slug', element: <PlayerProfile /> }], {
    initialEntries: [`/players/${slug}`],
  })
  render(<RouterProvider router={router} />)
}

describe('PlayerProfile', () => {
  it('shows the player profile', async () => {
    playerService.getPlayerBySlug.mockResolvedValue({ player: PLAYER, memories: [] })
    renderProfile()

    expect(await screen.findByRole('heading', { level: 1, name: 'Test Player' })).toBeTruthy()
    expect(playerService.getPlayerBySlug.mock.calls[0][0]).toBe('test-player')
    expect(screen.getByText('Goalkeeper')).toBeTruthy()
    expect(screen.getByText('Batch 2024-2028 • ECE')).toBeTruthy()
    expect(screen.getByText('Current')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Test Player — NIST FC goalkeeper' })).toBeTruthy()
    // The title is set in an effect, which can run after the heading appears.
    await waitFor(() => expect(document.title).toBe('Test Player | NIST FC'))
  })

  it('renders the bio as plain text', async () => {
    playerService.getPlayerBySlug.mockResolvedValue({ player: PLAYER, memories: [] })
    renderProfile()

    const bio = await screen.findByText(/First line/)
    expect(bio.textContent).toBe('First line.\nSecond line <b>not bold</b>.')
    expect(bio.querySelector('b')).toBeNull()
  })

  it('hides the memories section while there are none', async () => {
    playerService.getPlayerBySlug.mockResolvedValue({ player: PLAYER, memories: [] })
    renderProfile()
    await screen.findByRole('heading', { level: 1 })

    expect(screen.queryByText(/memories/i)).toBeNull()
  })

  it('shows the player memories and links to all of them when there are 12', async () => {
    const memories = Array.from({ length: 12 }, (_, i) => ({
      id: `m${i}`,
      title: `Memory ${i + 1}`,
      slug: `memory-${i + 1}`,
      date: '2025-12-12T00:00:00.000Z',
      location: '',
      excerpt: '',
      coverImage: { url: 'https://res.cloudinary.com/demo/image/upload/c.jpg', publicId: 'c' },
      photoCount: 0,
    }))
    playerService.getPlayerBySlug.mockResolvedValue({ player: PLAYER, memories })
    renderProfile()

    expect(await screen.findByRole('heading', { level: 2, name: 'Memories' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Memory 1' }).getAttribute('href')).toBe('/memories/memory-1')
    expect(
      screen.getByRole('link', { name: 'View all memories with Test Player' }).getAttribute('href'),
    ).toBe('/memories?player=1')
  })

  it('shows the not-found page for an unknown slug', async () => {
    playerService.getPlayerBySlug.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }))
    renderProfile('nobody')

    expect(await screen.findByRole('heading', { name: 'Page not found.' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to players' })).toBeTruthy()
  })

  it('shows an error with Retry for other failures', async () => {
    playerService.getPlayerBySlug.mockRejectedValue(Object.assign(new Error('x'), { status: 500 }))
    renderProfile()

    expect(await screen.findByRole('heading', { name: 'Unable to load this player.' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})
