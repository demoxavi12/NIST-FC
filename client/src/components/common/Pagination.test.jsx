import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import Pagination from './Pagination'

function renderPagination(page, pages) {
  return render(
    <MemoryRouter>
      <Pagination page={page} pages={pages} getHref={(p) => `?page=${p}`} />
    </MemoryRouter>,
  )
}

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = renderPagination(1, 1)
    expect(container.innerHTML).toBe('')
  })

  it('marks the current page and links to neighbours', () => {
    renderPagination(5, 10)
    const nav = screen.getByRole('navigation', { name: 'Pagination' })

    expect(within(nav).getByRole('link', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page')
    expect(within(nav).getByRole('link', { name: /Previous/ }).getAttribute('href')).toBe('/?page=4')
    expect(within(nav).getByRole('link', { name: /Next/ }).getAttribute('href')).toBe('/?page=6')
    const pages = within(nav)
      .getAllByRole('link', { name: /^Page / })
      .map((link) => link.textContent)
    expect(pages).toEqual(['1', '4', '5', '6', '10'])
  })

  it('disables Previous on the first page and Next on the last', () => {
    renderPagination(1, 3)
    expect(screen.queryByRole('link', { name: /Previous/ })).toBeNull()
    expect(screen.getByText('Previous').closest('[aria-disabled]')).toBeTruthy()
  })
})
