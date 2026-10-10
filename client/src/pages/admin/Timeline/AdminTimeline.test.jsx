import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as timelineService from '../../../services/timelineService'
import AdminTimeline from './AdminTimeline'

vi.mock('../../../services/timelineService', () => ({
  listAdminTimeline: vi.fn(),
  updateTimelineEvent: vi.fn(),
  deleteTimelineEvent: vi.fn(),
  reorderTimeline: vi.fn(),
}))

const event = (id, title, overrides = {}) => ({
  id,
  title,
  year: 2022,
  date: null,
  description: '',
  image: null,
  category: 'milestone',
  memory: null,
  order: Number(id.slice(1)),
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})
const EVENTS = [
  event('e1', 'Founded', { category: 'founding', memory: { id: 'm1', title: 'Kickoff', slug: 'kickoff', published: false } }),
  event('e2', 'First Cup', { published: false }),
  event('e3', 'Champions', { year: 2025 }),
]

function renderPage(entry = '/admin/timeline') {
  const router = createMemoryRouter(
    [
      { path: '/admin/timeline', element: <AdminTimeline /> },
      { path: '/elsewhere', element: <p>Elsewhere</p> },
    ],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const rowTitles = () => within(screen.getByRole('table')).getAllByRole('rowheader').map((cell) => cell.textContent)

beforeEach(() => {
  vi.clearAllMocks()
  timelineService.listAdminTimeline.mockResolvedValue(EVENTS)
})

describe('AdminTimeline list', () => {
  it('lists all events in order with year, category, linked memory (draft labelled) and visibility', async () => {
    renderPage()
    const table = await screen.findByRole('table', { name: 'Timeline events in display order' })
    expect(rowTitles()).toEqual(['Founded', 'First Cup', 'Champions'])
    const first = within(table).getAllByRole('row')[1]
    expect(within(first).getByText('Founding')).toBeTruthy()
    expect(within(first).getByText('Kickoff')).toBeTruthy()
    expect(within(first).getAllByText('Draft')).toHaveLength(1)
    expect(within(within(table).getAllByRole('row')[2]).getByText('Draft')).toBeTruthy()
    expect(timelineService.listAdminTimeline.mock.calls[0][0]).toEqual({ published: undefined })
  })

  it('filters by visibility and only allows reordering the full list', async () => {
    renderPage('/admin/timeline?status=draft')
    await screen.findByRole('table')
    expect(timelineService.listAdminTimeline.mock.calls[0][0]).toEqual({ published: false })
    expect(screen.getByRole('button', { name: 'Reorder' }).disabled).toBe(true)
    expect(screen.getByText('Show all events to reorder.')).toBeTruthy()
  })

  it('publishes a draft after confirmation', async () => {
    timelineService.updateTimelineEvent.mockResolvedValue({})
    renderPage()
    const table = await screen.findByRole('table')
    fireEvent.click(within(table).getByRole('button', { name: 'Publish First Cup' }))
    const dialog = screen.getByRole('dialog', { name: 'Publish event?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }))
    expect(await screen.findByText('First Cup was published.')).toBeTruthy()
    expect(timelineService.updateTimelineEvent).toHaveBeenCalledWith('e2', { published: true })
  })

  it('confirms permanent deletion, explaining that the memory is not affected', async () => {
    timelineService.deleteTimelineEvent.mockResolvedValue()
    renderPage()
    const table = await screen.findByRole('table')
    fireEvent.click(within(table).getByRole('button', { name: 'Delete Founded' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete timeline event?' })
    expect(dialog.textContent).toContain('permanently delete Founded and its image')
    expect(dialog.textContent).toContain('The linked memory is not affected.')
    expect(dialog.textContent).toContain('To hide it instead, unpublish it.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))
    expect(await screen.findByText('Founded was deleted.')).toBeTruthy()
    expect(timelineService.deleteTimelineEvent).toHaveBeenCalledWith('e1')
  })

  it('shows an empty state with Add Event', async () => {
    timelineService.listAdminTimeline.mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No timeline events added yet.' })).toBeTruthy()
  })
})

describe('AdminTimeline reorder', () => {
  async function startReorder() {
    const router = renderPage()
    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Reorder' }))
    return router
  }
  const positions = () =>
    within(screen.getByRole('region', { name: 'Reorder events' }))
      .getAllByRole('listitem')
      .map((item) => item.querySelector('.font-semibold.text-ink').textContent)

  it('moves events with buttons, announces each move and disables impossible moves', async () => {
    await startReorder()
    expect(screen.getByRole('button', { name: 'Move Founded up' }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('button', { name: 'Move Champions down' }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('button', { name: 'Move Founded down' }).getAttribute('aria-disabled')).toBe('false')
    expect(screen.getByRole('button', { name: 'Save order' }).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Move Champions up' }))
    expect(positions()).toEqual(['Founded', 'Champions', 'First Cup'])
    expect(screen.getByText('Champions moved to position 2 of 3.')).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move Champions up' })))

    fireEvent.click(screen.getByRole('button', { name: 'Move Champions up' }))
    expect(positions()).toEqual(['Champions', 'Founded', 'First Cup'])
    // At the top the button keeps focus but does nothing, so repeated presses
    // never move the event back down.
    const up = screen.getByRole('button', { name: 'Move Champions up' })
    await waitFor(() => expect(document.activeElement).toBe(up))
    expect(up.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(up)
    expect(positions()).toEqual(['Champions', 'Founded', 'First Cup'])
  })

  it('saves the whole order in one request', async () => {
    timelineService.reorderTimeline.mockResolvedValue()
    await startReorder()
    fireEvent.click(screen.getByRole('button', { name: 'Move First Cup down' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save order' }))

    expect(await screen.findByText('Timeline order saved.')).toBeTruthy()
    expect(timelineService.reorderTimeline).toHaveBeenCalledTimes(1)
    expect(timelineService.reorderTimeline).toHaveBeenCalledWith(['e1', 'e3', 'e2'])
    expect(timelineService.listAdminTimeline).toHaveBeenCalledTimes(2)
  })

  it('cancels back to the saved order', async () => {
    await startReorder()
    fireEvent.click(screen.getByRole('button', { name: 'Move Founded down' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(rowTitles()).toEqual(['Founded', 'First Cup', 'Champions'])
    fireEvent.click(screen.getByRole('button', { name: 'Reorder' }))
    expect(positions()).toEqual(['Founded', 'First Cup', 'Champions'])
    expect(timelineService.reorderTimeline).not.toHaveBeenCalled()
  })

  it('explains a 409 conflict', async () => {
    timelineService.reorderTimeline.mockRejectedValue(Object.assign(new Error('changed'), { status: 409 }))
    await startReorder()
    fireEvent.click(screen.getByRole('button', { name: 'Move Founded down' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save order' }))
    expect((await screen.findByRole('alert')).textContent).toBe(
      'The timeline was changed by someone else. Reload the page and reorder again.',
    )
  })

  it('warns before leaving with an unsaved order', async () => {
    const router = await startReorder()
    fireEvent.click(screen.getByRole('button', { name: 'Move Founded down' }))
    router.navigate('/elsewhere')
    const dialog = await screen.findByRole('dialog', { name: 'Leave without saving the order?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Leave page' }))
    expect(await screen.findByText('Elsewhere')).toBeTruthy()
  })
})
