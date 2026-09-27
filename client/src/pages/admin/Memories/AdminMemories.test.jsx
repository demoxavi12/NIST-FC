import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as memoryService from '../../../services/memoryService'
import AdminMemories from './AdminMemories'

vi.mock('../../../services/memoryService', () => ({
  listAdminMemories: vi.fn(),
  updateMemory: vi.fn(),
  deleteMemory: vi.fn(),
}))

const MEMORY = {
  id: 'm1',
  title: 'Inter-College Final',
  slug: 'inter-college-final',
  date: '2025-12-12T00:00:00.000Z',
  location: '',
  excerpt: '',
  coverImage: { url: 'https://res.cloudinary.com/demo/image/upload/c.jpg', publicId: 'c' },
  photoCount: 3,
  published: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderPage(entry = '/admin/memories') {
  const router = createMemoryRouter([{ path: '/admin/memories', element: <AdminMemories /> }], {
    initialEntries: [entry],
  })
  render(<RouterProvider router={router} />)
}

const lastParams = () => memoryService.listAdminMemories.mock.calls.at(-1)[0]

beforeEach(() => {
  vi.clearAllMocks()
  memoryService.listAdminMemories.mockResolvedValue({
    memories: [MEMORY],
    pagination: { page: 1, pages: 1, total: 1 },
  })
})

describe('AdminMemories', () => {
  it('lists memories including drafts, 20 per page', async () => {
    renderPage()
    const table = await screen.findByRole('table', { name: 'Memories, latest first' })
    expect(within(table).getByRole('rowheader', { name: 'Inter-College Final' })).toBeTruthy()
    expect(within(table).getByText('Draft')).toBeTruthy()
    expect(lastParams()).toMatchObject({ search: '', published: undefined, page: 1, limit: 20 })
  })

  it('passes the visibility filter to the API', async () => {
    renderPage('/admin/memories?status=draft&search=final')
    await screen.findByRole('table')
    expect(lastParams()).toMatchObject({ search: 'final', published: false })
  })

  it('publishes a draft after confirmation', async () => {
    memoryService.updateMemory.mockResolvedValue({ ...MEMORY, published: true })
    renderPage()
    const table = await screen.findByRole('table')
    fireEvent.click(within(table).getByRole('button', { name: 'Publish Inter-College Final' }))

    const dialog = screen.getByRole('dialog', { name: 'Publish memory?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }))

    expect(await screen.findByText('Inter-College Final was published.')).toBeTruthy()
    expect(memoryService.updateMemory).toHaveBeenCalledWith('m1', { published: true })
  })

  it('confirms permanent deletion and suggests unpublishing instead', async () => {
    memoryService.deleteMemory.mockResolvedValue()
    renderPage()
    const table = await screen.findByRole('table')
    fireEvent.click(within(table).getByRole('button', { name: 'Delete Inter-College Final' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete memory?' })
    expect(dialog.textContent).toContain('all of its gallery photos')
    expect(dialog.textContent).toContain('To hide it instead, unpublish it.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))

    expect(await screen.findByText('Inter-College Final was deleted.')).toBeTruthy()
    expect(memoryService.deleteMemory).toHaveBeenCalledWith('m1')
  })

  it('shows an empty state with an Add Memory action', async () => {
    memoryService.listAdminMemories.mockResolvedValue({ memories: [], pagination: { page: 1, pages: 0, total: 0 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No memories added yet.' })).toBeTruthy()
  })
})
