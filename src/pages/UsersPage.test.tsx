import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import App from '../App';
import { AppSidebar } from '../components/layout/AppSidebar';
import { getNavItems } from '../components/layout/nav';
import type { AdminUserDto, Page } from '../types/api';
import { UsersPage } from './UsersPage';

const {
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  searchUsers,
  updateUserRole,
  deleteUser,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  hasValidAccessSession: vi.fn(),
  getCurrentEmail: vi.fn(),
  getAccessTokenExpiresAt: vi.fn(),
  searchUsers: vi.fn(),
  updateUserRole: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  clearSession: vi.fn(),
}));

vi.mock('../api/users', () => ({
  searchUsers,
  getAdminUser: vi.fn(),
  updateUserRole,
  deleteUser,
}));

vi.mock('../api/user', () => ({
  getUserLoans: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: true,
  }),
  getUserProfile: vi.fn().mockResolvedValue({ name: 'Library Admin', email: 'alisafarli@gmail.com' }),
  borrowOwnBook: vi.fn(),
  returnOwnBook: vi.fn(),
}));

vi.mock('../api/admin', () => ({
  getLoans: vi.fn(),
  getAdminDashboard: vi.fn(),
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    totalLoans: 0,
    activeLoans: 0,
    returnedLoans: 0,
    totalBooksBorrowed: 0,
    totalMembersWithLoans: 0,
  }),
  getBookAnalytics: vi.fn(),
  getAuthorAnalytics: vi.fn(),
  getMemberAnalytics: vi.fn(),
}));

vi.mock('../api/books', () => ({
  listBooks: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      offset: 0,
      paged: true,
      unpaged: false,
      sort: { empty: true, sorted: false, unsorted: true },
    },
    sort: { empty: true, sorted: false, unsorted: true },
  }),
  searchBooks: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
}));

vi.mock('../api/authors', () => ({
  listAuthors: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      offset: 0,
      paged: true,
      unpaged: false,
      sort: { empty: true, sorted: false, unsorted: true },
    },
    sort: { empty: true, sorted: false, unsorted: true },
  }),
  createAuthor: vi.fn(),
  updateAuthor: vi.fn(),
  deleteAuthor: vi.fn(),
  getAuthor: vi.fn(),
}));

vi.mock('../api/members', () => ({
  listMembers: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
  }),
  searchMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  getMember: vi.fn(),
  borrowBook: vi.fn(),
}));

const adminUser: AdminUserDto = {
  id: 1,
  fullName: 'Ali Safarli',
  email: 'alisafarli@gmail.com',
  role: 'ADMIN',
  createdAt: '2026-01-01T00:00:00Z',
};

const regularUser: AdminUserDto = {
  id: 2,
  fullName: 'Ada Lovelace',
  email: 'ada@library.com',
  role: 'USER',
  createdAt: '2026-01-02T00:00:00Z',
};

function pageOf(content: AdminUserDto[], overrides: Partial<Page<AdminUserDto>> = {}): Page<AdminUserDto> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
    numberOfElements: content.length,
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      offset: 0,
      paged: true,
      unpaged: false,
      sort: { empty: false, sorted: true, unsorted: false },
    },
    sort: { empty: false, sorted: true, unsorted: false },
    ...overrides,
  };
}

function renderUsersPage(path = '/users') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <UsersPage />
    </MemoryRouter>,
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentRole.mockReturnValue('ADMIN');
    hasValidAccessSession.mockReturnValue(true);
    getCurrentEmail.mockReturnValue('alisafarli@gmail.com');
    getAccessTokenExpiresAt.mockReturnValue(null);
    searchUsers.mockResolvedValue(pageOf([adminUser, regularUser]));
    updateUserRole.mockResolvedValue({ ...regularUser, role: 'ADMIN' });
    deleteUser.mockResolvedValue(undefined);
  });

  it('does not show Users in USER navigation and shows it for ADMIN', () => {
    expect(getNavItems('USER').map((item) => item.to)).not.toContain('/users');
    expect(getNavItems('ADMIN').map((item) => item.to)).toContain('/users');

    getCurrentRole.mockReturnValue('USER');
    render(
      <MemoryRouter>
        <AppSidebar id="nav" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('redirects an authenticated USER away from /users', async () => {
    getCurrentRole.mockReturnValue('USER');
    getCurrentEmail.mockReturnValue('user@library.com');

    render(
      <MemoryRouter initialEntries={['/users']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /Welcome back/ })).toBeInTheDocument();
    expect(searchUsers).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('lets an ADMIN load the user table', async () => {
    renderUsersPage();

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@library.com')).toBeInTheDocument();
    expect(screen.getByText('Ali Safarli')).toBeInTheDocument();
    expect(searchUsers).toHaveBeenCalledWith({ page: 0, size: 20, sort: 'fullName,asc' });
    expect(screen.getByRole('button', { name: 'Make admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove admin' })).toBeInTheDocument();
  });

  it('asks for confirmation before promoting a USER to ADMIN', async () => {
    const user = userEvent.setup();
    renderUsersPage();
    await screen.findByText('Ada Lovelace');

    await user.click(screen.getByRole('button', { name: 'Make admin' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Grant ADMIN role?');
    expect(updateUserRole).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Make admin' }));

    await waitFor(() => {
      expect(updateUserRole).toHaveBeenCalledWith(2, 'ADMIN');
    });
  });

  it('asks for confirmation before removing ADMIN', async () => {
    const user = userEvent.setup();
    updateUserRole.mockResolvedValue({ ...adminUser, role: 'USER' });
    renderUsersPage();
    await screen.findByText('Ali Safarli');

    await user.click(screen.getByRole('button', { name: 'Remove admin' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Remove ADMIN role?');

    await user.click(within(dialog).getByRole('button', { name: 'Remove admin' }));

    await waitFor(() => {
      expect(updateUserRole).toHaveBeenCalledWith(1, 'USER');
    });
  });

  it('shows a 403 message when role change is forbidden', async () => {
    const user = userEvent.setup();
    updateUserRole.mockRejectedValue(
      new ApiError({
        timestamp: '2026-01-01T00:00:00Z',
        status: 403,
        error: 'Forbidden',
        message: 'Access denied',
        fieldErrors: null,
      }),
    );
    renderUsersPage();
    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Make admin' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Make admin' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
  });
});
