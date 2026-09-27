import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as memoryService from '../../../services/memoryService'
import Memories from './Memories'

vi.mock('../../../services/memoryService', () => ({ listMemories: vi.fn() }))

const MEMORY = {
  id: 'm1',
  title: 'Inter-College Final',
  slug: 'inter-college-final',
  date: '2025-12-12T00:00:00.000Z',
  location: 'NIST Ground',
  excerpt: 'A day to remember.',
  coverImage: { url: 'https://res.cloudinary.com/demo/image/upload/c.jpg', publicId: 'c' },
  photoCount: 4,
}

function renderPage(entry = '/memories') {
  const router = createMemoryRouter([{ path: '/memories', element: <Memories /> }], {
    initialEntries: [entry],
  })
  render(<RouterProvider router={router} />)
}

const lastParams = () => memoryService.listMemories.mock.calls.at(-1)[0]

beforeEach(() => {
  memoryService.listMemories.mockReset()
  memoryService.listMemories.mockResolvedValue({
    memories: [MEMORY],
    pagination: { page: 1, pages: 1, total: 1 },
  })
})

describe('Memories', () => {
  it('lists published memories, 12 per page', async () => {
    renderPage()

    const link = await screen.findByRole('link', { name: 'Inter-College Final' })
    expect(link.getAttribute('href')).toBe('/memories/inter-college-final')
    expect(screen.getByText('12 December 2025')).toBeTruthy()
    expect(screen.getByText(/NIST Ground/)).toBeTruthy()
    expect(lastParams()).toMatchObject({ page: 1, limit: 12, tag: '', player: '' })
    // The title is set in an effect, which can run after the heading appears.
    await waitFor(() => expect(document.title).toBe('Memories | NIST FC'))
  })

  it('filters by tag from the URL and offers a way back to all memories', async () => {
    renderPage('/memories?tag=Tournament&page=2')

    await screen.findByRole('link', { name: 'Inter-College Final' })
    expect(lastParams()).toMatchObject({ tag: 'tournament', page: 2 })
    expect(screen.getByText(/Showing memories tagged/).textContent).toContain('“tournament”')
    expect(screen.getByRole('link', { name: 'Show all memories' }).getAttribute('href')).toBe('/memories')
  })

  it('filters by player id and ignores an invalid one', async () => {
    renderPage('/memories?player=64b000000000000000000001')
    await screen.findByRole('link', { name: 'Inter-College Final' })
    expect(lastParams().player).toBe('64b000000000000000000001')
    expect(screen.getByText('Showing memories featuring the selected player')).toBeTruthy()
  })

  it('ignores a malformed player id', async () => {
    renderPage('/memories?player=nope')
    await screen.findByRole('link', { name: 'Inter-College Final' })
    expect(lastParams().player).toBe('')
    expect(screen.queryByText(/Showing memories/)).toBeNull()
  })

  it('shows an empty state', async () => {
    memoryService.listMemories.mockResolvedValue({ memories: [], pagination: { page: 1, pages: 0, total: 0 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No memories found.' })).toBeTruthy()
  })

  it('shows an error with Retry', async () => {
    memoryService.listMemories.mockRejectedValue(Object.assign(new Error('x'), { status: 500 }))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Unable to load memories.' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})
