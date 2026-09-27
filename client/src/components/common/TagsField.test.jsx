import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import TagsField from './TagsField'

function Harness({ initial = [], maxTags = 20 }) {
  const [tags, setTags] = useState(initial)
  return <TagsField id="tags" label="Tags" tags={tags} onChange={setTags} maxTags={maxTags} maxLength={30} />
}

const input = () => screen.getByLabelText('Tags')
const chips = () => screen.queryAllByRole('listitem').map((item) => item.textContent)

function type(value, key = 'Enter') {
  fireEvent.change(input(), { target: { value } })
  fireEvent.keyDown(input(), { key })
}

describe('TagsField', () => {
  it('adds trimmed, lower-cased, unique tags with Enter or comma', () => {
    render(<Harness />)
    type('  Tournament ')
    type('final', ',')
    type('TOURNAMENT')
    expect(chips()).toEqual(['tournament', 'final'])
    expect(input().value).toBe('')
  })

  it('removes a tag', () => {
    render(<Harness initial={['final', 'derby']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag final' }))
    expect(chips()).toEqual(['derby'])
  })

  it('rejects tags that are too long or beyond the limit', () => {
    render(<Harness initial={['a']} maxTags={1} />)
    type('x'.repeat(31))
    expect(screen.getByText('Each tag must be at most 30 characters')).toBeTruthy()
    type('b')
    expect(screen.getByText('A memory can have at most 1 tags')).toBeTruthy()
    expect(chips()).toEqual(['a'])
  })
})
