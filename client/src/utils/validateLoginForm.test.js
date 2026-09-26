import { describe, expect, it } from 'vitest'
import { validateLoginForm } from './validateLoginForm'

describe('validateLoginForm', () => {
  it('accepts a valid email and password', () => {
    expect(validateLoginForm({ email: ' admin@example.com ', password: 'x' })).toEqual({})
  })

  it('requires both fields', () => {
    expect(validateLoginForm({ email: '   ', password: '' })).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    })
  })

  it('rejects malformed emails', () => {
    for (const email of ['admin', 'admin@', 'admin@example', 'a b@example.com']) {
      expect(validateLoginForm({ email, password: 'x' }).email).toBe(
        'Email must be a valid email address',
      )
    }
  })
})
