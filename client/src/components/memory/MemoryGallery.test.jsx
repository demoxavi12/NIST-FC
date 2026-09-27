import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MemoryGallery from './MemoryGallery'

const PHOTOS = [1, 2, 3].map((n) => ({
  url: `https://res.cloudinary.com/demo/image/upload/nist-fc/memories/m/p${n}.jpg`,
  publicId: `nist-fc/memories/m/p${n}`,
}))

function openPhoto(index) {
  render(<MemoryGallery photos={PHOTOS} title="Final Day" />)
  fireEvent.click(screen.getByRole('button', { name: `View photo ${index} of 3` }))
  return document.querySelector('dialog')
}

describe('MemoryGallery and Lightbox', () => {
  it('shows thumbnails, never the full-size image', () => {
    render(<MemoryGallery photos={PHOTOS} title="Final Day" />)
    const thumbnail = screen.getByRole('button', { name: 'View photo 1 of 3' }).querySelector('img')
    expect(thumbnail.getAttribute('src')).toContain('/upload/f_auto,q_auto,c_fill,g_auto,w_480,h_360/')
    expect(thumbnail.getAttribute('loading')).toBe('lazy')
  })

  it('opens the selected photo with a counter and descriptive alt text', () => {
    const dialog = openPhoto(2)
    expect(dialog.hasAttribute('open')).toBe(true)
    expect(screen.getByText('2 of 3')).toBeTruthy()
    const image = screen.getByRole('img', { name: 'Photo 2 of 3 from Final Day' })
    expect(image.getAttribute('src')).toContain('c_limit,w_1600,h_1600')
  })

  it('moves with the arrow keys and buttons, wrapping at the ends', () => {
    const dialog = openPhoto(3)
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(screen.getByText('1 of 3')).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' })
    expect(screen.getByText('3 of 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }))
    expect(screen.getByText('2 of 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(screen.getByText('3 of 3')).toBeTruthy()
  })

  it('changes photo on a horizontal swipe', () => {
    const dialog = openPhoto(1)
    const surface = dialog.firstElementChild
    fireEvent.pointerDown(surface, { pointerType: 'touch', clientX: 300 })
    fireEvent.pointerUp(surface, { pointerType: 'touch', clientX: 200 })
    expect(screen.getByText('2 of 3')).toBeTruthy()
  })

  it('closes with Escape and with the close button', () => {
    let dialog = openPhoto(1)
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(dialog.hasAttribute('open')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'View photo 1 of 3' }))
    dialog = document.querySelector('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Close photo viewer' }))
    expect(dialog.hasAttribute('open')).toBe(false)
  })
})
