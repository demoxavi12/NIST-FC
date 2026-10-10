import { render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as timelineService from '../../../services/timelineService'
import Timeline from './Timeline'

vi.mock('../../../services/timelineService', () => ({ listTimeline: vi.fn() }))

const img = (id) => ({ url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`, publicId: id })
const EVENTS = [
  {
    id: 'e1',
    title: 'Team Founded',
    year: 2022,
    date: '2022-08-15T00:00:00.000Z',
    description: 'Where it began.\nSecond <b>line</b>.',
    image: img('nist-fc/timeline/a'),
    category: 'founding',
    memory: { title: 'First Practice', slug: 'first-practice', coverImage: img('c') },
  },
  { id: 'e2', title: 'First Tournament', year: 2023, date: null, description: '', image: null, category: 'tournament', memory: null },
]

function renderPage() {
  const router = createMemoryRouter([{ path: '/timeline', element: <Timeline /> }], { initialEntries: ['/timeline'] })
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  timelineService.listTimeline.mockReset()
})

describe('Timeline', () => {
  it('shows the events in the saved order with year, date, category and memory link', async () => {
    timelineService.listTimeline.mockResolvedValue(EVENTS)
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Our Journey' })).toBeTruthy()
    expect(screen.getByText('From the beginning to today.')).toBeTruthy()
    const list = await screen.findByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual(['Team Founded', 'First Tournament'])

    const first = within(items[0])
    expect(first.getByText('2022')).toBeTruthy()
    expect(first.getByText('15 August 2022').getAttribute('datetime')).toBe('2022-08-15')
    expect(first.getByText('Founding')).toBeTruthy()
    expect(first.getByRole('link', { name: 'View memory: First Practice' }).getAttribute('href')).toBe('/memories/first-practice')
    expect(items[0].querySelector('img').getAttribute('loading')).toBe('lazy')

    const second = within(items[1])
    expect(second.getByText('Tournament')).toBeTruthy()
    expect(second.queryByRole('link')).toBeNull()
    expect(items[1].querySelector('time')).toBeNull()
    expect(items[1].querySelector('img')).toBeNull()
    await waitFor(() => expect(document.title).toBe('Our Journey | NIST FC'))
  })

  it('renders descriptions as plain text', async () => {
    timelineService.listTimeline.mockResolvedValue(EVENTS)
    renderPage()
    const description = await screen.findByText(/Where it began/)
    expect(description.textContent).toBe('Where it began.\nSecond <b>line</b>.')
    expect(description.querySelector('b')).toBeNull()
  })

  it('shows an empty state', async () => {
    timelineService.listTimeline.mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No timeline events yet.' })).toBeTruthy()
  })

  it('shows an error with Retry', async () => {
    timelineService.listTimeline.mockRejectedValueOnce(Object.assign(new Error('x'), { status: 500 })).mockResolvedValue(EVENTS)
    renderPage()
    const retry = await screen.findByRole('button', { name: 'Try again' })
    expect(screen.getByRole('heading', { name: 'Unable to load the timeline.' })).toBeTruthy()
    retry.click()
    expect(await screen.findByRole('heading', { name: 'Team Founded' })).toBeTruthy()
  })
})
