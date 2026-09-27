import { render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import * as memoryService from '../../../services/memoryService'
import MemoryDetail from './MemoryDetail'

vi.mock('../../../services/memoryService', () => ({ getMemoryBySlug: vi.fn() }))

const image = (id) => ({ url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`, publicId: id })

const MEMORY = {
  id: 'm1',
  title: 'Inter-College Final',
  slug: 'inter-college-final',
  description: 'First line.\nSecond <b>line</b>.',
  date: '2025-12-12T00:00:00.000Z',
  location: 'NIST Ground',
  coverImage: image('cover'),
  photos: [image('p1'), image('p2')],
  players: [
    { id: 'p1', name: 'Test Player', slug: 'test-player', photo: image('pl'), position: 'Forward', status: 'former' },
  ],
  tags: ['final', 'tournament'],
  published: true,
}
const NAV = (slug, title) => ({ slug, title, date: '2025-01-01T00:00:00.000Z', coverImage: image(slug) })

function renderDetail(slug = 'inter-college-final') {
  const router = createMemoryRouter([{ path: '/memories/:slug', element: <MemoryDetail /> }], {
    initialEntries: [`/memories/${slug}`],
  })
  render(<RouterProvider router={router} />)
}

describe('MemoryDetail', () => {
  it('shows the memory with its cover, gallery, players and tags', async () => {
    memoryService.getMemoryBySlug.mockResolvedValue({ memory: MEMORY, previous: null, next: null })
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1, name: 'Inter-College Final' })).toBeTruthy()
    expect(screen.getByText('12 December 2025').getAttribute('datetime')).toBe('2025-12-12')
    expect(screen.getByRole('img', { name: 'Cover photo for Inter-College Final' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /View photo/ })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Test Player' }).getAttribute('href')).toBe('/players/test-player')
    expect(screen.getByRole('link', { name: 'Memories tagged final' }).getAttribute('href')).toBe('/memories?tag=final')
    // The title is set in an effect, which can run after the heading appears.
    await waitFor(() => expect(document.title).toBe('Inter-College Final | NIST FC'))
  })

  it('renders the description as plain text', async () => {
    memoryService.getMemoryBySlug.mockResolvedValue({ memory: MEMORY, previous: null, next: null })
    renderDetail()
    const description = await screen.findByText(/First line/)
    expect(description.textContent).toBe('First line.\nSecond <b>line</b>.')
    expect(description.querySelector('b')).toBeNull()
  })

  it('hides the gallery, players and tags when there are none', async () => {
    memoryService.getMemoryBySlug.mockResolvedValue({
      memory: { ...MEMORY, photos: [], players: [], tags: [] },
      previous: null,
      next: null,
    })
    renderDetail()
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('heading', { name: /Gallery/ })).toBeNull()
    expect(screen.queryByText('Players in this memory')).toBeNull()
    expect(screen.queryByText('Tags')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'More memories' })).toBeNull()
  })

  it('links to the older and newer memories', async () => {
    memoryService.getMemoryBySlug.mockResolvedValue({
      memory: MEMORY,
      previous: NAV('older-one', 'Older One'),
      next: NAV('newer-one', 'Newer One'),
    })
    renderDetail()
    const nav = await screen.findByRole('navigation', { name: 'More memories' })
    const [older, newer] = within(nav).getAllByRole('link')
    expect(older.textContent).toContain('Older memory')
    expect(older.getAttribute('href')).toBe('/memories/older-one')
    expect(newer.textContent).toContain('Newer memory')
    expect(newer.getAttribute('href')).toBe('/memories/newer-one')
  })

  it('shows the not-found page for an unknown or unpublished memory', async () => {
    memoryService.getMemoryBySlug.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }))
    renderDetail('draft')
    expect(await screen.findByRole('heading', { name: 'Page not found.' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to memories' })).toBeTruthy()
  })
})
