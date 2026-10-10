import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as memoryService from '../../../services/memoryService'
import * as timelineService from '../../../services/timelineService'
import AdminTimelineForm from './AdminTimelineForm'

vi.mock('../../../services/timelineService', () => ({
  getTimelineEventById: vi.fn(),
  createTimelineEvent: vi.fn(),
  updateTimelineEvent: vi.fn(),
}))
vi.mock('../../../services/memoryService', () => ({ listAdminMemories: vi.fn() }))

const img = (id) => ({ url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`, publicId: id })
const MEMORIES = [
  { id: 'm1', title: 'Kickoff Day', date: '2022-08-15T00:00:00.000Z', published: true },
  { id: 'm2', title: 'Secret Draft', date: '2023-01-01T00:00:00.000Z', published: false },
]
const EVENT = {
  id: 'e1',
  title: 'Team Founded',
  year: 2022,
  date: '2022-08-15T00:00:00.000Z',
  description: 'Where it began.',
  image: img('nist-fc/timeline/old'),
  category: 'founding',
  memory: { id: 'm1', title: 'Kickoff Day', slug: 'kickoff-day', published: true },
  order: 1,
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function ListProbe() {
  const location = useLocation()
  return <p>List page: {location.state?.flash}</p>
}

function renderForm(entry) {
  const router = createMemoryRouter(
    [
      { path: '/admin/timeline', element: <ListProbe /> },
      { path: '/admin/timeline/new', element: <AdminTimelineForm /> },
      { path: '/admin/timeline/:id/edit', element: <AdminTimelineForm /> },
      { path: '/elsewhere', element: <p>Elsewhere</p> },
    ],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const field = (label) => screen.getByLabelText(new RegExp(`^${label}`))
const save = () => fireEvent.click(screen.getByRole('button', { name: /Save Event|Saving/ }))
const entries = (formData) => Object.fromEntries(formData.entries())

beforeEach(() => {
  vi.clearAllMocks()
  memoryService.listAdminMemories.mockResolvedValue({ memories: MEMORIES, pagination: { total: 2 } })
})

describe('Add timeline event', () => {
  it('validates required fields and limits before sending', async () => {
    renderForm('/admin/timeline/new')
    await screen.findByRole('heading', { level: 1, name: 'Add Timeline Event' })

    save()
    expect(await screen.findByText('Title is required')).toBeTruthy()
    expect(screen.getByText('Year is required')).toBeTruthy()
    expect(screen.getByText('Category is required')).toBeTruthy()
    expect(document.activeElement).toBe(field('Title'))

    fireEvent.change(field('Title'), { target: { value: 'T' } })
    fireEvent.change(field('Year'), { target: { value: '1899' } })
    save()
    expect(await screen.findByText('Year must be a whole number from 1900 to 2100')).toBeTruthy()
    expect(document.activeElement).toBe(field('Year'))
    expect(timelineService.createTimelineEvent).not.toHaveBeenCalled()
  })

  it('fills the year from the date, but never moves the date when the year is typed', async () => {
    renderForm('/admin/timeline/new')
    await screen.findByRole('heading', { level: 1 })

    fireEvent.change(field('Exact date'), { target: { value: '2023-05-04' } })
    expect(field('Year').value).toBe('2023')

    fireEvent.change(field('Year'), { target: { value: '2024' } })
    expect(field('Exact date').value).toBe('2023-05-04')
    fireEvent.change(field('Title'), { target: { value: 'Cup' } })
    fireEvent.change(field('Category'), { target: { value: 'tournament' } })
    save()
    expect(await screen.findByText('Date must be in the selected year')).toBeTruthy()
    expect(timelineService.createTimelineEvent).not.toHaveBeenCalled()
  })

  it('creates an event with a linked draft memory and an image', async () => {
    timelineService.createTimelineEvent.mockResolvedValue({ ...EVENT, title: 'First Cup' })
    renderForm('/admin/timeline/new')
    await screen.findByRole('heading', { level: 1 })

    fireEvent.change(field('Title'), { target: { value: '  First Cup ' } })
    fireEvent.change(field('Exact date'), { target: { value: '2023-01-02' } })
    fireEvent.change(field('Category'), { target: { value: 'tournament' } })
    fireEvent.change(field('Description'), { target: { value: 'We played.' } })
    fireEvent.change(document.getElementById('image'), {
      target: { files: [new File(['img'], 'cup.jpg', { type: 'image/jpeg' })] },
    })
    const draftOption = await screen.findByRole('radio', { name: /Secret Draft/ })
    expect(within(draftOption.closest('label')).getByText('Draft')).toBeTruthy()
    fireEvent.click(draftOption)
    fireEvent.click(screen.getByRole('checkbox', { name: /Published/ }))
    save()

    expect(await screen.findByText('List page: First Cup was added.')).toBeTruthy()
    const body = timelineService.createTimelineEvent.mock.calls[0][0]
    expect(entries(body)).toMatchObject({
      title: 'First Cup',
      year: '2023',
      date: '2023-01-02',
      category: 'tournament',
      description: 'We played.',
      memory: 'm2',
      published: 'true',
    })
    expect(body.get('image').name).toBe('cup.jpg')
    expect(body.get('order')).toBeNull()
  })

  it('asks before leaving with unsaved changes', async () => {
    const router = renderForm('/admin/timeline/new')
    await screen.findByRole('heading', { level: 1 })
    fireEvent.change(field('Title'), { target: { value: 'Draft' } })
    router.navigate('/elsewhere')
    const dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/timeline/new'))
  })
})

describe('Edit timeline event', () => {
  beforeEach(() => {
    timelineService.getTimelineEventById.mockResolvedValue(EVENT)
  })

  it('sends only changed fields, unlinking the memory, with expectedUpdatedAt', async () => {
    timelineService.updateTimelineEvent.mockResolvedValue(EVENT)
    renderForm('/admin/timeline/e1/edit')
    await screen.findByDisplayValue('Team Founded')
    expect(field('Exact date').value).toBe('2022-08-15')

    fireEvent.change(field('Description'), { target: { value: 'Updated.' } })
    fireEvent.click(await screen.findByRole('radio', { name: 'No memory' }))
    save()

    expect(await screen.findByText('List page: Team Founded was updated.')).toBeTruthy()
    const [id, body] = timelineService.updateTimelineEvent.mock.calls[0]
    expect(id).toBe('e1')
    expect(entries(body)).toEqual({
      description: 'Updated.',
      memory: '',
      expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('removes the current image', async () => {
    timelineService.updateTimelineEvent.mockResolvedValue(EVENT)
    renderForm('/admin/timeline/e1/edit')
    await screen.findByDisplayValue('Team Founded')
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
    expect(screen.getByText('The image will be removed when you save.')).toBeTruthy()
    save()
    await screen.findByText(/List page/)
    expect(entries(timelineService.updateTimelineEvent.mock.calls[0][1])).toEqual({
      removeImage: 'true',
      expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('reports when there is nothing to save', async () => {
    renderForm('/admin/timeline/e1/edit')
    await screen.findByDisplayValue('Team Founded')
    save()
    expect(await screen.findByText('No changes to save.')).toBeTruthy()
    expect(timelineService.updateTimelineEvent).not.toHaveBeenCalled()
  })

  it('explains a conflicting edit', async () => {
    timelineService.updateTimelineEvent.mockRejectedValue(
      Object.assign(new Error('This timeline event was changed by someone else. Reload and try again.'), { status: 409 }),
    )
    renderForm('/admin/timeline/e1/edit')
    await screen.findByDisplayValue('Team Founded')
    fireEvent.change(field('Title'), { target: { value: 'New title' } })
    save()
    expect((await screen.findByRole('alert')).textContent).toContain('changed by someone else')
  })

  it('shows not found for a missing event', async () => {
    timelineService.getTimelineEventById.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }))
    renderForm('/admin/timeline/zzz/edit')
    expect(await screen.findByRole('heading', { name: 'Timeline event not found.' })).toBeTruthy()
  })
})
