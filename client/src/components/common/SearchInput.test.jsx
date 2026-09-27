import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchInput from './SearchInput'

describe('SearchInput', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const input = () => screen.getByLabelText('Search players')

  it('reports the text once typing pauses', () => {
    const onSearch = vi.fn()
    render(<SearchInput id="s" label="Search players" value="" onSearch={onSearch} />)

    fireEvent.change(input(), { target: { value: 'ra' } })
    fireEvent.change(input(), { target: { value: 'rah' } })
    act(() => vi.advanceTimersByTime(299))
    expect(onSearch).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('rah')
  })

  it('follows outside changes such as Clear filters', () => {
    const { rerender } = render(
      <SearchInput id="s" label="Search players" value="rahul" onSearch={vi.fn()} />,
    )
    expect(input().value).toBe('rahul')

    rerender(<SearchInput id="s" label="Search players" value="" onSearch={vi.fn()} />)
    expect(input().value).toBe('')
  })

  it('does not overwrite newer typing with its own committed value', () => {
    let committed = ''
    const onSearch = vi.fn((value) => (committed = value))
    const { rerender } = render(
      <SearchInput id="s" label="Search players" value={committed} onSearch={onSearch} />,
    )

    fireEvent.change(input(), { target: { value: 'rah' } })
    act(() => vi.advanceTimersByTime(300))
    fireEvent.change(input(), { target: { value: 'rahu' } })
    rerender(<SearchInput id="s" label="Search players" value={committed} onSearch={onSearch} />)

    expect(input().value).toBe('rahu')
  })
})
