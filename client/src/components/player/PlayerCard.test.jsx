import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import PlayerCard from './PlayerCard'

const PLAYER = {
  id: '1',
  name: 'Rahul Das',
  slug: 'rahul-das',
  photo: { url: 'https://res.cloudinary.com/demo/image/upload/v1/p.jpg', publicId: 'p' },
  position: 'Midfielder',
  batch: '2023-2027',
  branch: 'CSE',
  status: 'former',
}

describe('PlayerCard', () => {
  it('shows the player and links to their profile', () => {
    render(
      <MemoryRouter>
        <PlayerCard player={PLAYER} />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Rahul Das' })
    expect(link.getAttribute('href')).toBe('/players/rahul-das')
    expect(screen.getByRole('heading', { level: 3, name: 'Rahul Das' })).toBeTruthy()
    expect(screen.getByText('Midfielder')).toBeTruthy()
    expect(screen.getByText('Batch 2023-2027 • CSE')).toBeTruthy()
    // Status is text, not colour alone.
    expect(screen.getByText('Former')).toBeTruthy()
  })

  it('loads a lazy, resized image with descriptive alt text', () => {
    render(
      <MemoryRouter>
        <PlayerCard player={PLAYER} />
      </MemoryRouter>,
    )

    const image = screen.getByRole('img', { name: 'Rahul Das — NIST FC midfielder' })
    expect(image.getAttribute('loading')).toBe('lazy')
    expect(image.getAttribute('src')).toContain('/upload/f_auto,q_auto,c_fill,g_auto,w_480,h_600/')
    expect(image.getAttribute('srcset')).toContain('240w')
  })
})
