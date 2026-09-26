import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../context/AuthContext'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'

const ADMIN = { id: '1', name: 'NIST FC Admin', email: 'admin@example.com', role: 'admin' }
const MENU = { isOpen: false, toggle: () => {}, close: () => {}, toggleRef: { current: null } }

function renderWithAuth(ui, auth) {
  const value = { status: 'authenticated', admin: ADMIN, logout: vi.fn(), ...auth }
  render(
    <AuthContext value={value}>
      <MemoryRouter initialEntries={['/admin']}>{ui}</MemoryRouter>
    </AuthContext>,
  )
  return value
}

const logoutButton = () => screen.getByRole('button', { name: /Log out|Logging out/ })

describe('AdminSidebar logout', () => {
  it('calls logout and shows a pending state', async () => {
    let finish
    const logout = vi.fn(() => new Promise((resolve) => (finish = resolve)))
    renderWithAuth(<AdminSidebar isOpen={false} onNavigate={() => {}} />, { logout })

    fireEvent.click(logoutButton())

    expect(logout).toHaveBeenCalledTimes(1)
    expect(logoutButton().textContent).toBe('Logging out…')
    expect(logoutButton().disabled).toBe(true)
    await act(async () => finish())
  })

  it('stays signed in and shows an error when logout fails', async () => {
    const logout = vi.fn().mockRejectedValue(Object.assign(new Error('fail'), { status: 500 }))
    renderWithAuth(<AdminSidebar isOpen={false} onNavigate={() => {}} />, { logout })

    fireEvent.click(logoutButton())

    expect((await screen.findByRole('alert')).textContent).toBe(
      "Couldn't log out. Please try again.",
    )
    expect(logoutButton().disabled).toBe(false)
    expect(logoutButton().textContent).toBe('Log out')
  })
})

describe('AdminHeader', () => {
  it('shows the signed-in admin', () => {
    renderWithAuth(<AdminHeader menu={MENU} />)

    expect(screen.getByText(/Signed in as/).textContent).toBe('Signed in as NIST FC Admin')
  })
})
