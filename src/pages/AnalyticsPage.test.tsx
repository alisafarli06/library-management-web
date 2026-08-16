import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import App from '../App';
import { AppSidebar } from '../components/layout/AppSidebar';
import { getNavItems } from '../components/layout/nav';
import type {
  AuthorBorrowAnalyticsDto,
  BookBorrowAnalyticsDto,
  LoanAnalyticsSummaryDto,
  MemberBorrowAnalyticsDto,
  Page,
} from '../types/api';
import { AnalyticsPage } from './AnalyticsPage';

const {
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  getAnalyticsSummary,
  getBookAnalytics,
  getAuthorAnalytics,
  getMemberAnalytics,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  hasValidAccessSession: vi.fn(),
  getCurrentEmail: vi.fn(),
  getAccessTokenExpiresAt: vi.fn(),
  getAnalyticsSummary: vi.fn(),
  getBookAnalytics: vi.fn(),
  getAuthorAnalytics: vi.fn(),
  getMemberAnalytics: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  clearSession: vi.fn(),
}));

vi.mock('../api/admin', () => ({
  getLoans: vi.fn(),
  getAdminDashboard: vi.fn(),
  getAnalyticsSummary,
  getBookAnalytics,
  getAuthorAnalytics,
  getMemberAnalytics,
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
  getUserProfile: vi.fn().mockResolvedValue({ name: 'Library User', email: 'user@library.com' }),
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

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div style={{ width: 640, height: 240 }}>{children}</div>,
  };
});

function pageOf<T>(content: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
    numberOfElements: content.length,
    pageable: {
      pageNumber: 0,
      pageSize: 10,
      offset: 0,
      paged: true,
      unpaged: false,
      sort: { empty: true, sorted: false, unsorted: true },
    },
    sort: { empty: true, sorted: false, unsorted: true },
    ...overrides,
  };
}

const summary: LoanAnalyticsSummaryDto = {
  totalLoans: 42,
  activeLoans: 7,
  returnedLoans: 35,
  totalBooksBorrowed: 18,
  totalMembersWithLoans: 12,
};

const bookRow: BookBorrowAnalyticsDto = { bookId: 9, bookTitle: 'Clean Code', borrowCount: 12 };
const authorRow: AuthorBorrowAnalyticsDto = { authorId: 4, authorName: 'Robert C. Martin', borrowCount: 20 };
const memberRow: MemberBorrowAnalyticsDto = { memberId: 3, memberName: 'Ada Lovelace', borrowCount: 8 };

function renderAnalyticsPage(path = '/analytics') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AnalyticsPage />
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

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentRole.mockReturnValue('ADMIN');
    hasValidAccessSession.mockReturnValue(true);
    getCurrentEmail.mockReturnValue('admin@library.com');
    getAccessTokenExpiresAt.mockReturnValue(null);
    getAnalyticsSummary.mockResolvedValue(summary);
    getBookAnalytics.mockResolvedValue(pageOf([bookRow]));
    getAuthorAnalytics.mockResolvedValue(pageOf([authorRow]));
    getMemberAnalytics.mockResolvedValue(pageOf([memberRow]));
  });

  it('lets an ADMIN access /analytics', async () => {
    renderAppAt('/analytics');
    expect(await screen.findByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Analytics' })).toBeInTheDocument();
  });

  it('redirects an authenticated USER to the dashboard', async () => {
    getCurrentRole.mockReturnValue('USER');
    getCurrentEmail.mockReturnValue('user@library.com');
    renderAppAt('/analytics');
    expect(await screen.findByRole('heading', { name: /Welcome back/ })).toBeInTheDocument();
    expect(getAnalyticsSummary).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Analytics' })).not.toBeInTheDocument();
  });

  it('does not show Analytics in USER navigation and shows it for ADMIN', () => {
    expect(getNavItems('USER').map((item) => item.to)).not.toContain('/analytics');
    expect(getNavItems('ADMIN').map((item) => item.to)).toContain('/analytics');

    getCurrentRole.mockReturnValue('USER');
    render(
      <MemoryRouter>
        <AppSidebar id="nav" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: 'Analytics' })).not.toBeInTheDocument();
  });

  it('calls the four analytics endpoints with default pagination', async () => {
    renderAnalyticsPage();
    await screen.findByText('Clean Code');
    expect(getAnalyticsSummary).toHaveBeenCalledTimes(1);
    expect(getBookAnalytics).toHaveBeenCalledWith({ page: 0, size: 10 });
    expect(getAuthorAnalytics).toHaveBeenCalledWith({ page: 0, size: 10 });
    expect(getMemberAnalytics).toHaveBeenCalledWith({ page: 0, size: 10 });
  });

  it('renders summary metrics and ranked rows', async () => {
    renderAnalyticsPage();
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getAllByText('12')).toHaveLength(2);
    expect(screen.getByText('Total Loans')).toBeInTheDocument();
    expect(screen.getByText('Active Loans')).toBeInTheDocument();
    expect(screen.getByText('Distinct Books')).toBeInTheDocument();
    expect(screen.getByText('Distinct Members')).toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Robert C. Martin')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByLabelText('Most borrowed books pagination')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Most borrowed authors pagination')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Most active members pagination')).not.toBeInTheDocument();
  });

  it('hides pagination controls when a section has only one page', async () => {
    renderAnalyticsPage();
    await screen.findByText('Clean Code');
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('paginates one ranked section without refetching the others', async () => {
    getBookAnalytics.mockResolvedValue(
      pageOf([bookRow], { totalPages: 3, totalElements: 21, last: false, number: 0 }),
    );
    getAuthorAnalytics.mockResolvedValue(
      pageOf([authorRow], { totalPages: 2, totalElements: 11, number: 1, first: false, last: true }),
    );
    getMemberAnalytics.mockResolvedValue(
      pageOf([memberRow], { totalPages: 4, totalElements: 31, number: 2, first: false, last: false }),
    );
    const user = userEvent.setup();
    renderAnalyticsPage('/analytics?authorsPage=1&membersPage=2');

    await screen.findByText('Clean Code');
    expect(getBookAnalytics).toHaveBeenCalledWith({ page: 0, size: 10 });
    expect(getAuthorAnalytics).toHaveBeenCalledWith({ page: 1, size: 10 });
    expect(getMemberAnalytics).toHaveBeenCalledWith({ page: 2, size: 10 });

    const booksNav = screen.getByLabelText('Most borrowed books pagination');
    await user.click(within(booksNav).getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(getBookAnalytics).toHaveBeenLastCalledWith({ page: 1, size: 10 });
    });
    expect(getAuthorAnalytics).toHaveBeenCalledTimes(1);
    expect(getMemberAnalytics).toHaveBeenCalledTimes(1);
    expect(getAnalyticsSummary).toHaveBeenCalledTimes(1);
  });

  it('shows independent empty states', async () => {
    getBookAnalytics.mockResolvedValue(pageOf([]));
    getAuthorAnalytics.mockResolvedValue(pageOf([]));
    getMemberAnalytics.mockResolvedValue(pageOf([]));
    renderAnalyticsPage();
    expect(await screen.findByText('No book borrowing activity yet.')).toBeInTheDocument();
    expect(screen.getByText('No author borrowing activity yet.')).toBeInTheDocument();
    expect(screen.getByText('No member borrowing activity yet.')).toBeInTheDocument();
  });

  it('shows ApiError.message in one section and still renders the others', async () => {
    getBookAnalytics.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-16T00:00:00Z',
        status: 403,
        error: 'Forbidden',
        message: 'Access denied',
        fieldErrors: null,
      }),
    );
    renderAnalyticsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    expect(await screen.findByText('Robert C. Martin')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('retries only the failed section', async () => {
    getAnalyticsSummary
      .mockRejectedValueOnce(
        new ApiError({
          timestamp: '2026-08-16T00:00:00Z',
          status: 500,
          error: 'Server Error',
          message: 'Analytics store unavailable',
          fieldErrors: null,
        }),
      )
      .mockResolvedValueOnce(summary);
    const user = userEvent.setup();
    renderAnalyticsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Analytics store unavailable');
    expect(await screen.findByText('Clean Code')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(getAnalyticsSummary).toHaveBeenCalledTimes(2);
    expect(getBookAnalytics).toHaveBeenCalledTimes(1);
  });
});
