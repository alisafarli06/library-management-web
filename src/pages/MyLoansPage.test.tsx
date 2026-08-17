import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import App from '../App';
import type { LoanDto, Page } from '../types/api';
import { MyLoansPage } from './MyLoansPage';

const {
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  getUserLoans,
  returnOwnBook,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  hasValidAccessSession: vi.fn(),
  getCurrentEmail: vi.fn(),
  getAccessTokenExpiresAt: vi.fn(),
  getUserLoans: vi.fn(),
  returnOwnBook: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  clearSession: vi.fn(),
}));

vi.mock('../api/user', () => ({
  getUserLoans,
  getUserProfile: vi.fn(),
  borrowOwnBook: vi.fn(),
  returnOwnBook,
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
  memberId: 9,
  memberName: 'Ada Lovelace',
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

function renderMyLoansPage(path = '/my-loans') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MyLoansPage />
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

describe('MyLoansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentRole.mockReturnValue('USER');
    hasValidAccessSession.mockReturnValue(true);
    getCurrentEmail.mockReturnValue('user@library.com');
    getAccessTokenExpiresAt.mockReturnValue(null);
    getUserLoans.mockResolvedValue(pageOf([activeLoan, returnedLoan]));
    returnOwnBook.mockResolvedValue(undefined);
  });

  it('lets a USER access /my-loans', async () => {
    renderAppAt('/my-loans');
    expect(await screen.findByRole('heading', { name: 'My Loans' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Loans' })).toBeInTheDocument();
  });

  it('lets an ADMIN access /my-loans', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    getCurrentEmail.mockReturnValue('admin@library.com');
    renderAppAt('/my-loans');
    expect(await screen.findByRole('heading', { name: 'My Loans' })).toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to login', async () => {
    hasValidAccessSession.mockReturnValue(false);
    getCurrentRole.mockReturnValue(null);
    renderAppAt('/my-loans');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(getUserLoans).not.toHaveBeenCalled();
  });

  it('loads loans with the default page, size, and sort', async () => {
    renderMyLoansPage();
    await screen.findByText('Clean Code');
    expect(getUserLoans).toHaveBeenCalledWith({ page: 0, size: 20, sort: 'borrowedAt,desc' });
  });

  it('renders active and returned loans with the correct status', async () => {
    renderMyLoansPage();

    const activeRow = (await screen.findByText('Clean Code')).closest('tr');
    const returnedRow = screen.getByText('Effective Java').closest('tr');
    expect(activeRow).not.toBeNull();
    expect(returnedRow).not.toBeNull();
    expect(within(activeRow as HTMLElement).getByText('Currently Borrowed')).toBeInTheDocument();
    expect(within(activeRow as HTMLElement).getByRole('button', { name: 'Mark as Returned' })).toBeInTheDocument();
    expect(within(returnedRow as HTMLElement).getByText('Returned')).toBeInTheDocument();
    expect(within(returnedRow as HTMLElement).queryByRole('button', { name: 'Mark as Returned' })).not.toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('preserves URL pagination and sort, then paginates and re-sorts via the API', async () => {
    getUserLoans.mockResolvedValue(
      pageOf([activeLoan], { totalPages: 3, totalElements: 41, last: false, number: 1 }),
    );
    const user = userEvent.setup();
    renderMyLoansPage('/my-loans?page=1&size=20&sort=borrowedAt,asc');

    await screen.findByText('Clean Code');
    expect(getUserLoans).toHaveBeenCalledWith({ page: 1, size: 20, sort: 'borrowedAt,asc' });

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(getUserLoans).toHaveBeenCalledWith({ page: 2, size: 20, sort: 'borrowedAt,asc' });
    });

    await user.click(screen.getByRole('button', { name: 'Borrowed' }));
    await waitFor(() => {
      expect(getUserLoans).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'borrowedAt,desc' });
    });
  });

  it('shows the empty state when there is no borrowing history', async () => {
    getUserLoans.mockResolvedValue(pageOf([]));
    renderMyLoansPage();
    expect(await screen.findByText('No borrowing history yet.')).toBeInTheDocument();
    expect(screen.getByText('Books you borrow will appear here.')).toBeInTheDocument();
  });

  it('shows ApiError.message for a missing-member 404 and retries for USER accounts', async () => {
    getUserLoans
      .mockRejectedValueOnce(
        new ApiError({
          timestamp: '2026-08-16T00:00:00Z',
          status: 404,
          error: 'Not Found',
          message: 'Member not found for authenticated user',
          fieldErrors: null,
        }),
      )
      .mockResolvedValueOnce(pageOf([activeLoan]));
    const user = userEvent.setup();
    renderMyLoansPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Member not found for authenticated user');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Clean Code')).toBeInTheDocument();
    expect(getUserLoans).toHaveBeenCalledTimes(2);
  });

  it('shows a friendly empty state for ADMIN accounts without a linked member record', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    getCurrentEmail.mockReturnValue('admin@library.com');
    getUserLoans.mockRejectedValueOnce(
      new ApiError({
        timestamp: '2026-08-16T00:00:00Z',
        status: 404,
        error: 'Not Found',
        message: 'Member not found for authenticated user',
        fieldErrors: null,
      }),
    );
    renderMyLoansPage();

    expect(
      await screen.findByText("As an admin, you don't have a personal loan history. Visit Loan Management to view all loans."),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Loan Management' })).toHaveAttribute('href', '/loans');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getUserLoans).toHaveBeenCalledTimes(1);
  });

  it('filters the currently loaded page by status without extra API calls', async () => {
    const user = userEvent.setup();
    renderMyLoansPage();
    await screen.findByText('Clean Code');
    const callsAfterLoad = getUserLoans.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Currently Borrowed' }));
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.queryByText('Effective Java')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Returned' }));
    expect(screen.getByText('Effective Java')).toBeInTheDocument();
    expect(screen.queryByText('Clean Code')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Effective Java')).toBeInTheDocument();
    expect(getUserLoans).toHaveBeenCalledTimes(callsAfterLoad);
  });

  it('shows Mark as Returned only for active loans', async () => {
    renderMyLoansPage();
    const activeRow = (await screen.findByText('Clean Code')).closest('tr') as HTMLElement;
    const returnedRow = screen.getByText('Effective Java').closest('tr') as HTMLElement;
    expect(within(activeRow).getByRole('button', { name: 'Mark as Returned' })).toBeInTheDocument();
    expect(within(returnedRow).queryByRole('button', { name: 'Mark as Returned' })).not.toBeInTheDocument();
  });

  it('opens a confirmation dialog when Mark as Returned is clicked', async () => {
    const user = userEvent.setup();
    renderMyLoansPage();
    await user.click(await screen.findByRole('button', { name: 'Mark as Returned' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Mark as returned?' })).toBeInTheDocument();
    expect(within(dialog).getByText('Are you sure you want to return "Clean Code"?')).toBeInTheDocument();
    expect(returnOwnBook).not.toHaveBeenCalled();
  });

  it('closes the dialog on Cancel without calling the return API', async () => {
    const user = userEvent.setup();
    renderMyLoansPage();
    await user.click(await screen.findByRole('button', { name: 'Mark as Returned' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(returnOwnBook).not.toHaveBeenCalled();
  });

  it('calls POST return on confirm, then closes, shows success, and refetches the current page', async () => {
    const returnedActive: LoanDto = {
      ...activeLoan,
      returnedAt: '2026-08-16T12:00:00Z',
    };
    getUserLoans
      .mockResolvedValueOnce(pageOf([activeLoan, returnedLoan], { totalPages: 3, totalElements: 41, last: false, number: 1 }))
      .mockResolvedValueOnce(pageOf([returnedActive, returnedLoan], { totalPages: 3, totalElements: 41, last: false, number: 1 }));
    const user = userEvent.setup();
    renderMyLoansPage('/my-loans?page=1&size=20&sort=borrowedAt,asc');

    await user.click(await screen.findByRole('button', { name: 'Mark as Returned' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as Returned' }));

    expect(returnOwnBook).toHaveBeenCalledTimes(1);
    expect(returnOwnBook).toHaveBeenCalledWith(3);
    expect(await screen.findByRole('status')).toHaveTextContent('Marked “Clean Code” as returned.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(getUserLoans).toHaveBeenCalledTimes(2);
    });
    expect(getUserLoans).toHaveBeenLastCalledWith({ page: 1, size: 20, sort: 'borrowedAt,asc' });

    const cleanCodeRow = screen.getByText('Clean Code').closest('tr') as HTMLElement;
    expect(within(cleanCodeRow).getByText('Returned')).toBeInTheDocument();
    expect(within(cleanCodeRow).queryByRole('button', { name: 'Mark as Returned' })).not.toBeInTheDocument();
  });

  it('shows the backend 404 message in the dialog and allows retry', async () => {
    returnOwnBook
      .mockRejectedValueOnce(
        new ApiError({
          timestamp: '2026-08-16T00:00:00Z',
          status: 404,
          error: 'Not Found',
          message: 'Active loan not found',
          fieldErrors: null,
        }),
      )
      .mockResolvedValueOnce(undefined);
    getUserLoans
      .mockResolvedValueOnce(pageOf([activeLoan]))
      .mockResolvedValueOnce(
        pageOf([{ ...activeLoan, returnedAt: '2026-08-16T12:00:00Z' }]),
      );
    const user = userEvent.setup();
    renderMyLoansPage();

    await user.click(await screen.findByRole('button', { name: 'Mark as Returned' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as Returned' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Active loan not found');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as Returned' }));
    expect(returnOwnBook).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('status')).toHaveTextContent('Marked “Clean Code” as returned.');
  });

  it('disables dialog actions while the return request is in flight', async () => {
    let resolveReturn: (() => void) | undefined;
    returnOwnBook.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveReturn = resolve;
        }),
    );
    const user = userEvent.setup();
    renderMyLoansPage();

    await user.click(await screen.findByRole('button', { name: 'Mark as Returned' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as Returned' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Marking…' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(returnOwnBook).toHaveBeenCalledTimes(1);

    resolveReturn?.();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
