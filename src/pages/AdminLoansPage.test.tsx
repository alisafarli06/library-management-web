import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import App from '../App';
import { AppSidebar } from '../components/layout/AppSidebar';
import { getNavItems } from '../components/layout/nav';
import { formatLoanDate } from '../components/loans/loanListQuery';
import type { LoanDto, Page } from '../types/api';
import { AdminLoansPage } from './AdminLoansPage';

const {
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  getLoans,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  hasValidAccessSession: vi.fn(),
  getCurrentEmail: vi.fn(),
  getAccessTokenExpiresAt: vi.fn(),
  getLoans: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  clearSession: vi.fn(),
}));

vi.mock('../api/admin', () => ({
  getLoans,
  getAdminDashboard: vi.fn(),
}));

vi.mock('../api/user', () => ({
  getUserLoans: vi.fn().mockResolvedValue({
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
  getUserProfile: vi.fn(),
  borrowOwnBook: vi.fn(),
  returnOwnBook: vi.fn(),
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
  listMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  getMember: vi.fn(),
  borrowBook: vi.fn(),
}));

const activeLoan: LoanDto = {
  id: 1,
  memberId: 9,
  memberName: 'Ada Lovelace',
  bookId: 3,
  bookTitle: 'Clean Code',
  borrowedAt: '2026-08-16T10:30:00Z',
  returnedAt: null,
};

const returnedLoan: LoanDto = {
  id: 2,
  memberId: 11,
  memberName: 'Grace Hopper',
  bookId: 4,
  bookTitle: 'Effective Java',
  borrowedAt: '2026-07-01T09:00:00Z',
  returnedAt: '2026-07-15T16:45:00Z',
};

function pageOf(content: LoanDto[], overrides: Partial<Page<LoanDto>> = {}): Page<LoanDto> {
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

function renderAdminLoansPage(path = '/loans') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminLoansPage />
    </MemoryRouter>,
  );
}

function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('AdminLoansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentRole.mockReturnValue('ADMIN');
    hasValidAccessSession.mockReturnValue(true);
    getCurrentEmail.mockReturnValue('admin@library.com');
    getAccessTokenExpiresAt.mockReturnValue(null);
    getLoans.mockResolvedValue(pageOf([activeLoan, returnedLoan]));
  });

  it('lets an ADMIN access /loans', async () => {
    renderAppAt('/loans');
    expect(await screen.findByRole('heading', { name: 'Loan Management' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loans' })).toBeInTheDocument();
  });

  it('redirects an authenticated USER to the dashboard', async () => {
    getCurrentRole.mockReturnValue('USER');
    getCurrentEmail.mockReturnValue('user@library.com');
    renderAppAt('/loans');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(getLoans).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Loans' })).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to login', async () => {
    hasValidAccessSession.mockReturnValue(false);
    getCurrentRole.mockReturnValue(null);
    renderAppAt('/loans');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(getLoans).not.toHaveBeenCalled();
  });

  it('does not show Loans in USER navigation and shows it for ADMIN', () => {
    expect(getNavItems('USER').map((item) => item.to)).not.toContain('/loans');
    expect(getNavItems('ADMIN').map((item) => item.to)).toContain('/loans');

    getCurrentRole.mockReturnValue('USER');
    render(
      <MemoryRouter>
        <AppSidebar id="nav" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: 'Loans' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Loans' })).toBeInTheDocument();
  });

  it('shows Loans in ADMIN navigation', () => {
    render(
      <MemoryRouter>
        <AppSidebar id="nav" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Loans' })).toBeInTheDocument();
  });

  it('loads loans with the default page, size, and sort', async () => {
    renderAdminLoansPage();
    await screen.findByText('Clean Code');
    expect(getLoans).toHaveBeenCalledWith({ page: 0, size: 20, sort: 'borrowedAt,desc' });
  });

  it('renders book title, member name, status, and returned date', async () => {
    renderAdminLoansPage();

    const activeRow = (await screen.findByText('Clean Code')).closest('tr') as HTMLElement;
    const returnedRow = screen.getByText('Effective Java').closest('tr') as HTMLElement;

    expect(within(activeRow).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(activeRow).getByText('Borrowed')).toBeInTheDocument();
    expect(within(activeRow).getByText('—')).toBeInTheDocument();
    expect(within(activeRow).queryByText(String(activeLoan.memberId))).not.toBeInTheDocument();
    expect(within(activeRow).queryByText(String(activeLoan.bookId))).not.toBeInTheDocument();

    expect(within(returnedRow).getByText('Grace Hopper')).toBeInTheDocument();
    expect(within(returnedRow).getByText('Returned')).toBeInTheDocument();
    expect(within(returnedRow).getByText(formatLoanDate(returnedLoan.returnedAt as string))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Return Book' })).not.toBeInTheDocument();
  });

  it('preserves URL pagination and sort, then paginates and re-sorts via the API', async () => {
    getLoans.mockResolvedValue(
      pageOf([activeLoan], { totalPages: 3, totalElements: 41, last: false, number: 1 }),
    );
    const user = userEvent.setup();
    renderAdminLoansPage('/loans?page=1&size=20&sort=borrowedAt,asc');

    await screen.findByText('Clean Code');
    expect(getLoans).toHaveBeenCalledWith({ page: 1, size: 20, sort: 'borrowedAt,asc' });

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(getLoans).toHaveBeenCalledWith({ page: 2, size: 20, sort: 'borrowedAt,asc' });
    });

    await user.click(screen.getByRole('button', { name: /^Borrowed\s/ }));
    await waitFor(() => {
      expect(getLoans).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'borrowedAt,desc' });
    });
  });

  it('shows the empty state when there is no loan history', async () => {
    getLoans.mockResolvedValue(pageOf([]));
    renderAdminLoansPage();
    expect(await screen.findByText('No loan history yet.')).toBeInTheDocument();
    expect(screen.getByText('Borrowing activity will appear here.')).toBeInTheDocument();
  });

  it('shows ApiError.message and retries', async () => {
    getLoans
      .mockRejectedValueOnce(
        new ApiError({
          timestamp: '2026-08-16T00:00:00Z',
          status: 403,
          error: 'Forbidden',
          message: 'Access denied',
          fieldErrors: null,
        }),
      )
      .mockResolvedValueOnce(pageOf([activeLoan]));
    const user = userEvent.setup();
    renderAdminLoansPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Clean Code')).toBeInTheDocument();
    expect(getLoans).toHaveBeenCalledTimes(2);
  });

  it('filters the currently loaded page by status without extra API calls', async () => {
    const user = userEvent.setup();
    renderAdminLoansPage();
    await screen.findByText('Clean Code');
    const callsAfterLoad = getLoans.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Currently Borrowed' }));
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.queryByText('Effective Java')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Returned' }));
    expect(screen.getByText('Effective Java')).toBeInTheDocument();
    expect(screen.queryByText('Clean Code')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Effective Java')).toBeInTheDocument();
    expect(getLoans).toHaveBeenCalledTimes(callsAfterLoad);
  });
});
