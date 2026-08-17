import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const {
  getCurrentRole,
  getCurrentEmail,
  getUserProfile,
  getUserLoans,
  listBooks,
  listMembers,
  getAnalyticsSummary,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  getCurrentEmail: vi.fn(),
  getUserProfile: vi.fn(),
  getUserLoans: vi.fn(),
  listBooks: vi.fn(),
  listMembers: vi.fn(),
  getAnalyticsSummary: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  getCurrentEmail,
  hasValidAccessSession: vi.fn(() => true),
  clearSession: vi.fn(),
}));

vi.mock('../api/user', () => ({
  getUserProfile,
  getUserLoans,
  updateUserProfile: vi.fn(),
  borrowOwnBook: vi.fn(),
  returnOwnBook: vi.fn(),
}));

vi.mock('../api/books', () => ({
  listBooks,
}));

vi.mock('../api/members', () => ({
  listMembers,
}));

vi.mock('../api/admin', () => ({
  getAnalyticsSummary,
  getAdminDashboard: vi.fn(),
}));

function pageOf<T>(content: T[], extras: Partial<{ totalElements: number; totalPages: number }> = {}) {
  return {
    content,
    totalElements: extras.totalElements ?? content.length,
    totalPages: extras.totalPages ?? 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentEmail.mockReturnValue('anar@library.com');
    getUserProfile.mockResolvedValue({ name: 'Anar Safarli', email: 'anar@library.com' });
    listBooks.mockResolvedValue(pageOf([], { totalElements: 16 }));
    getUserLoans.mockResolvedValue(pageOf([]));
    listMembers.mockResolvedValue(pageOf([], { totalElements: 9 }));
    getAnalyticsSummary.mockResolvedValue({
      totalLoans: 12,
      activeLoans: 4,
      returnedLoans: 8,
      totalBooksBorrowed: 10,
      totalMembersWithLoans: 5,
    });
  });

  it('renders a personal USER workspace without admin metrics or email', async () => {
    getCurrentRole.mockReturnValue('USER');
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Welcome back, Anar' })).toBeInTheDocument();
    expect(screen.getByText(/Explore the library, discover something new/i)).toBeInTheDocument();
    expect(screen.queryByText('anar@library.com')).not.toBeInTheDocument();
    expect(screen.queryByText(/administrators only/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Overdue/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Total members')).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Browse Books' })).toHaveAttribute('href', '/books');
    expect(screen.getByRole('link', { name: 'My Loans' })).toHaveAttribute('href', '/my-loans');

    await waitFor(() => {
      expect(screen.getByText('16')).toBeInTheDocument();
    });
    expect(screen.getByText('Total books')).toBeInTheDocument();
    expect(screen.getByText('My active loans')).toBeInTheDocument();
    expect(screen.getByText('Nothing borrowed right now')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Browse books' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My loans' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Authors' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Book materials' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Members' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Analytics' })).not.toBeInTheDocument();
    expect(getAnalyticsSummary).not.toHaveBeenCalled();
    expect(listMembers).not.toHaveBeenCalled();
  });

  it('shows recent loans for a USER when loan history exists', async () => {
    getCurrentRole.mockReturnValue('USER');
    getUserLoans.mockResolvedValue(
      pageOf([
        {
          id: 1,
          memberId: 2,
          memberName: 'Anar Safarli',
          bookId: 9,
          bookTitle: 'The Pragmatic Programmer',
          borrowedAt: '2026-08-12T10:00:00Z',
          returnedAt: null,
        },
      ]),
    );
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Your recent loans' })).toBeInTheDocument();
    const recentSection = screen.getByRole('heading', { name: 'Your recent loans' }).closest('section');
    expect(recentSection).not.toBeNull();
    expect(within(recentSection as HTMLElement).getByText('The Pragmatic Programmer')).toBeInTheDocument();
    expect(within(recentSection as HTMLElement).getByText(/Borrowed/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Currently borrowed')).toBeInTheDocument();
  });

  it('keeps ADMIN overview metrics and management actions', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    getCurrentEmail.mockReturnValue('admin@library.com');
    getUserProfile.mockResolvedValue({ name: 'E2E Admin', email: 'admin@library.com' });
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Welcome back, E2E' })).toBeInTheDocument();
    expect(screen.getByText(/Manage the catalogue, members, and lending/i)).toBeInTheDocument();
    expect(screen.queryByText('admin@library.com')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    expect(screen.getByText('Total books')).toBeInTheDocument();
    expect(screen.getByText('Active loans')).toBeInTheDocument();
    expect(screen.getByText('Total members')).toBeInTheDocument();
    expect(screen.queryByText('My active loans')).not.toBeInTheDocument();
    expect(screen.queryByText(/Overdue/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your recent loans' })).not.toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Loans' })).toHaveAttribute('href', '/loans');
    expect(getAnalyticsSummary).toHaveBeenCalled();
    expect(listMembers).toHaveBeenCalled();
    expect(getUserLoans).not.toHaveBeenCalled();
  });

  it('links the USER active-loans card to My Loans', async () => {
    getCurrentRole.mockReturnValue('USER');
    renderDashboard();

    const activeLoansLabel = await screen.findByText('My active loans');
    const card = activeLoansLabel.closest('a');
    expect(card).not.toBeNull();
    expect(card).toHaveAttribute('href', '/my-loans');
    expect(within(card as HTMLElement).getByText('Browse books →')).toBeInTheDocument();
  });
});
