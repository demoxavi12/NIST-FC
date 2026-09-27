import { describe, expect, it } from 'vitest'
import { validatePhoto, validatePlayerForm } from './validatePlayerForm'

const VALID = {
  name: 'Rahul Das',
  position: 'Midfielder',
  batch: '2023-2027',
  branch: 'CSE',
  bio: '',
  status: 'current',
}
const photo = (name = 'p.jpg', type = 'image/jpeg', size = 1000) => ({ name, type, size })

describe('validatePlayerForm', () => {
  it('accepts a valid player', () => {
    expect(validatePlayerForm(VALID, { photo: photo(), requirePhoto: true })).toEqual({})
    expect(validatePlayerForm(VALID, { photo: null, requirePhoto: false })).toEqual({})
  })

  it('requires the documented fields and a photo when creating', () => {
    const errors = validatePlayerForm(
      { ...VALID, name: ' ', position: '', batch: '', branch: '' },
      { photo: null, requirePhoto: true },
    )
    expect(errors).toEqual({
      name: 'Name is required',
      position: 'Position is required',
      batch: 'Batch is required',
      branch: 'Branch is required',
      photo: 'Photo is required',
    })
  })

  it('validates the batch range format and order', () => {
    const check = (batch) => validatePlayerForm({ ...VALID, batch }, { photo: null }).batch
    expect(check('2024-2028')).toBeUndefined()
    expect(check(' 2025-2029 ')).toBeUndefined()
    expect(check('2023')).toBe('Batch must use the format YYYY-YYYY (e.g. 2023-2027)')
    expect(check('2023-27')).toBe('Batch must use the format YYYY-YYYY (e.g. 2023-2027)')
    expect(check('2027-2023')).toBe('The second batch year must be after the first')
    expect(check('2023-2023')).toBe('The second batch year must be after the first')
  })

  it('checks lengths', () => {
    const errors = validatePlayerForm(
      { ...VALID, name: 'x'.repeat(101), branch: 'x'.repeat(51), bio: 'x'.repeat(1001) },
      { photo: null },
    )
    expect(Object.keys(errors).sort()).toEqual(['bio', 'branch', 'name'])
  })
})

describe('validatePhoto', () => {
  it('accepts JPEG, PNG and WEBP within the size limit', () => {
    expect(validatePhoto(photo('a.jpeg'))).toBeNull()
    expect(validatePhoto(photo('a.PNG', 'image/png'))).toBeNull()
    expect(validatePhoto(photo('a.webp', 'image/webp'))).toBeNull()
  })

  it('rejects other types and oversized files', () => {
    expect(validatePhoto(photo('a.gif', 'image/gif'))).toBe('Photo must be a JPEG, PNG or WEBP image')
    expect(validatePhoto(photo('a.heic', 'image/heic'))).toBe('Photo must be a JPEG, PNG or WEBP image')
    expect(validatePhoto(photo('a.png', 'image/jpeg'))).toBe('Photo must be a JPEG, PNG or WEBP image')
    expect(validatePhoto(photo('a.jpg', 'image/jpeg', 6 * 1024 * 1024))).toBe('Image must be at most 5 MB')
  })
})
