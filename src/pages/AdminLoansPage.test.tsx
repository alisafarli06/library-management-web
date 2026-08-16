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
  searchLoans,
  returnBook,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  hasValidAccessSession: vi.fn(),
  getCurrentEmail: vi.fn(),
  getAccessTokenExpiresAt: vi.fn(),
  searchLoans: vi.fn(),
  returnBook: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  clearSession: vi.fn(),
}));

vi.mock('../api/admin', () => ({
  searchLoans,
  getLoans: vi.fn(),
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
  returnBook,
}));

const activeLoan: LoanDto = {
  id: 1,
  memberId: 9,
  memberName: 'Ada Lovelace',
  memberEmail: 'ada@library.com',
  bookId: 3,
  bookTitle: 'Clean Code',
  borrowedAt: '2026-08-16T10:30:00Z',
  returnedAt: null,
};

const returnedLoan: LoanDto = {
  id: 2,
  memberId: 11,
  memberName: 'Grace Hopper',
  memberEmail: 'grace@library.com',
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
    searchLoans.mockResolvedValue(pageOf([activeLoan, returnedLoan]));
    returnBook.mockResolvedValue(undefined);
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
    expect(searchLoans).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Loans' })).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to login', async () => {
    hasValidAccessSession.mockReturnValue(false);
    getCurrentRole.mockReturnValue(null);
    renderAppAt('/loans');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(searchLoans).not.toHaveBeenCalled();
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
    expect(searchLoans).toHaveBeenCalledWith({ page: 0, size: 20, sort: 'borrowedAt,desc', status: 'all' });
  });

  it('renders book title, member name, status, and returned date', async () => {
    renderAdminLoansPage();

    const activeRow = (await screen.findByText('Clean Code')).closest('tr') as HTMLElement;
    const returnedRow = screen.getByText('Effective Java').closest('tr') as HTMLElement;

    expect(within(activeRow).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(activeRow).getByText('Currently Borrowed')).toBeInTheDocument();
    expect(within(activeRow).getByText('—')).toBeInTheDocument();
    expect(within(activeRow).getByRole('button', { name: 'Mark as Returned' })).toBeInTheDocument();
    expect(within(activeRow).queryByText(String(activeLoan.memberId))).not.toBeInTheDocument();
    expect(within(activeRow).queryByText(String(activeLoan.bookId))).not.toBeInTheDocument();

    expect(within(returnedRow).getByText('Grace Hopper')).toBeInTheDocument();
    expect(within(returnedRow).getByText('Returned')).toBeInTheDocument();
    expect(within(returnedRow).getByText(formatLoanDate(returnedLoan.returnedAt as string))).toBeInTheDocument();
    expect(within(returnedRow).queryByRole('button', { name: 'Mark as Returned' })).not.toBeInTheDocument();
  });

  it('preserves URL pagination and sort, then paginates and re-sorts via the API', async () => {
    searchLoans.mockResolvedValue(
      pageOf([activeLoan], { totalPages: 3, totalElements: 41, last: false, number: 1 }),
    );
    const user = userEvent.setup();
    renderAdminLoansPage('/loans?page=1&size=20&sort=borrowedAt,asc');

    await screen.findByText('Clean Code');
    expect(searchLoans).toHaveBeenCalledWith({ page: 1, size: 20, sort: 'borrowedAt,asc', status: 'all' });

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(searchLoans).toHaveBeenCalledWith({ page: 2, size: 20, sort: 'borrowedAt,asc', status: 'all' });
    });

    await user.click(screen.getByRole('button', { name: 'Borrowed' }));
    await waitFor(() => {
      expect(searchLoans).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'borrowedAt,desc', status: 'all' });
    });
  });

  it('disables Previous/Next correctly on single-page and multi-page results', async () => {
    searchLoans.mockResolvedValue(pageOf([activeLoan, returnedLoan], { totalPages: 1, totalElements: 2 }));
    const first = renderAdminLoansPage();
    await screen.findByText('Clean Code');
    expect(screen.getByText('Page 1 of 1 · 2 loans')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    first.unmount();

    searchLoans.mockResolvedValue(
      pageOf([activeLoan], { totalPages: 3, totalElements: 41, last: false, number: 1 }),
    );
    renderAdminLoansPage('/loans?page=1&size=20&sort=borrowedAt,desc');
    expect(await screen.findByText('Page 2 of 3 · 41 loans')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('sorts by member name via the API', async () => {
    const user = userEvent.setup();
    renderAdminLoansPage();
    await screen.findByText('Clean Code');
    await user.click(screen.getByRole('button', { name: 'Member' }));
    await waitFor(() => {
      expect(searchLoans).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'member.name,asc', status: 'all' });
    });
  });

  it('shows the empty state when there is no loan history', async () => {
    searchLoans.mockResolvedValue(pageOf([]));
    renderAdminLoansPage();
    expect(await screen.findByText('No loan history yet.')).toBeInTheDocument();
    expect(screen.getByText('Borrowing activity will appear here.')).toBeInTheDocument();
  });

  it('shows ApiError.message and retries', async () => {
    searchLoans
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
    expect(searchLoans).toHaveBeenCalledTimes(2);
  });

  it('filters by status via the search API and resets to page 0', async () => {
    const user = userEvent.setup();
    searchLoans
      .mockResolvedValueOnce(pageOf([activeLoan, returnedLoan]))
      .mockResolvedValueOnce(pageOf([activeLoan]))
      .mockResolvedValueOnce(pageOf([returnedLoan]))
      .mockResolvedValueOnce(pageOf([activeLoan, returnedLoan]));
    renderAdminLoansPage();
    await screen.findByText('Clean Code');

    await user.click(screen.getByRole('button', { name: 'Currently Borrowed' }));
    await waitFor(() => {
      expect(searchLoans).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sort: 'borrowedAt,desc',
        status: 'borrowed',
      });
    });
    expect(await screen.findByText('Clean Code')).toBeInTheDocument();
    expect(screen.queryByText('Effective Java')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Returned' }));
    await waitFor(() => {
      expect(searchLoans).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sort: 'borrowedAt,desc',
        status: 'returned',
      });
    });
    expect(await screen.findByText('Effective Java')).toBeInTheDocument();
    expect(screen.queryByText('Clean Code')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => {
      expect(searchLoans).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sort: 'borrowedAt,desc',
        status: 'all',
      });
    });
  });

  it('debounces search input and calls the search API with q', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    searchLoans
      .mockResolvedValueOnce(pageOf([activeLoan, returnedLoan]))
      .mockResolvedValueOnce(pageOf([returnedLoan]));
    renderAdminLoansPage();
    await screen.findByText('Clean Code');

    await user.type(screen.getByLabelText('Search'), 'grace');
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(searchLoans).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sort: 'borrowedAt,desc',
        status: 'all',
        q: 'grace',
      });
    });
    expect(await screen.findByText('Effective Java')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows a full-history empty state when search returns no matches', async () => {
    searchLoans.mockResolvedValue(pageOf([]));
    renderAdminLoansPage('/loans?q=zzz&status=borrowed');
    expect(await screen.findByText('No loans match your filters.')).toBeInTheDocument();
    expect(screen.getByText('Try a different status filter or search term.')).toBeInTheDocument();
    expect(screen.queryByText(/full history/i)).not.toBeInTheDocument();
  });

  it('lets an ADMIN mark an active loan as returned', async () => {
    searchLoans
      .mockResolvedValueOnce(pageOf([activeLoan, returnedLoan]))
      .mockResolvedValueOnce(pageOf([{ ...activeLoan, returnedAt: '2026-08-16T12:00:00Z' }, returnedLoan]));
    const user = userEvent.setup();
    renderAdminLoansPage();

    await user.click(await screen.findByRole('button', { name: 'Mark as Returned' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Mark as returned?' })).toBeInTheDocument();
    expect(within(dialog).getByText(/Ada Lovelace \(ada@library\.com\)/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Mark as Returned' }));

    expect(returnBook).toHaveBeenCalledWith(9, 3);
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Marked “Clean Code” as returned for Ada Lovelace (ada@library.com).',
    );
    await waitFor(() => {
      expect(searchLoans).toHaveBeenCalledTimes(2);
    });
  });

  it('shows email when member name is a generic Borrower placeholder', async () => {
    searchLoans.mockResolvedValue(
      pageOf([
        {
          ...activeLoan,
          memberName: 'Borrower',
          memberEmail: 'casey@library.com',
        },
      ]),
    );
    renderAdminLoansPage();

    const row = (await screen.findByText('Clean Code')).closest('tr') as HTMLElement;
    expect(within(row).getByText('casey@library.com')).toBeInTheDocument();
    expect(within(row).queryByText('Borrower')).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(within(row).getByRole('button', { name: 'Mark as Returned' }));
    expect(within(screen.getByRole('dialog')).getByText(/casey@library\.com/)).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).queryByText(/\bBorrower\b/)).not.toBeInTheDocument();
  });

  it('shows Marking… on the dialog confirm button while the return request is in flight', async () => {
    let resolveReturn: (() => void) | undefined;
    returnBook.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveReturn = resolve;
        }),
    );
    const user = userEvent.setup();
    renderAdminLoansPage();

    await user.click(await screen.findByRole('button', { name: 'Mark as Returned' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as Returned' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Marking…' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();

    resolveReturn?.();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
