import { describe, expect, it } from 'vitest'
import { cloudinaryImageUrl, cloudinarySrcSet } from './cloudinaryImage'

const URL = 'https://res.cloudinary.com/demo/image/upload/v1/nist-fc/players/abc.jpg'

describe('cloudinaryImageUrl', () => {
  it('inserts size and optimisation transformations', () => {
    expect(cloudinaryImageUrl(URL, { width: 480, height: 600 })).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_auto,w_480,h_600/v1/nist-fc/players/abc.jpg',
    )
  })

  it('leaves non-Cloudinary URLs unchanged', () => {
    expect(cloudinaryImageUrl('blob:preview', { width: 100 })).toBe('blob:preview')
    expect(cloudinaryImageUrl(undefined)).toBeUndefined()
  })

  it('builds a width-based srcSet at a fixed aspect ratio', () => {
    const srcSet = cloudinarySrcSet(URL, [240, 480], 1.25)
    expect(srcSet).toContain('w_240,h_300/v1/nist-fc/players/abc.jpg 240w')
    expect(srcSet).toContain('w_480,h_600/v1/nist-fc/players/abc.jpg 480w')
  })
})
