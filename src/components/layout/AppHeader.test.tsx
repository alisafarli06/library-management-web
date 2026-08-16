import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

function renderHeader(overrides: Partial<Parameters<typeof AppHeader>[0]> = {}) {
  const props = {
    title: 'Dashboard',
    displayName: 'E2E Admin',
    role: 'ADMIN',
    menuOpen: false,
    onToggleMenu: vi.fn(),
    onLogout: vi.fn(),
    ...overrides,
  };

  render(
    <MemoryRouter>
      <AppHeader {...props} />
    </MemoryRouter>,
  );

  return props;
}

describe('AppHeader user menu', () => {
  it('shows display name, role, and initials without the email address', () => {
    renderHeader();

    expect(screen.getByText('E2E Admin')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('EA')).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('opens a menu with Settings and Log out actions', async () => {
    const user = userEvent.setup();
    const props = renderHeader();

    await user.click(screen.getByRole('button', { name: 'Account menu for E2E Admin' }));

    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();

    await user.click(within(menu).getByRole('menuitem', { name: 'Settings' }));
    expect(navigate).toHaveBeenCalledWith('/settings');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Account menu for E2E Admin' }));
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(props.onLogout).toHaveBeenCalled();
  });

  it('closes on Escape and outside click', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Account menu for E2E Admin' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Account menu for E2E Admin' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByText('Dashboard'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
