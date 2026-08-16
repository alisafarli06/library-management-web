import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import App from '../App';
import { AppSidebar } from '../components/layout/AppSidebar';
import { getNavItems } from '../components/layout/nav';
import type { MemberDto, Page } from '../types/api';
import { MembersPage } from './MembersPage';

const {
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  searchMembers,
  createMember,
  updateMember,
  deleteMember,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  hasValidAccessSession: vi.fn(),
  getCurrentEmail: vi.fn(),
  getAccessTokenExpiresAt: vi.fn(),
  searchMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  clearSession: vi.fn(),
}));

vi.mock('../api/members', () => ({
  searchMembers,
  listMembers: vi.fn(),
  createMember,
  updateMember,
  deleteMember,
  getMember: vi.fn(),
  borrowBook: vi.fn(),
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

const ada: MemberDto = { id: 3, name: 'Ada Lovelace', email: 'ada@library.com', activeLoanCount: 0 };
const grace: MemberDto = { id: 4, name: 'Grace Hopper', email: 'grace@library.com', activeLoanCount: 2 };
const unnamed: MemberDto = {
  id: 5,
  name: 'attach-admin@library.com',
  email: 'attach-admin@library.com',
  activeLoanCount: 0,
};

function pageOf(content: MemberDto[], overrides: Partial<Page<MemberDto>> = {}): Page<MemberDto> {
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

function renderMembersPage(path = '/members') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MembersPage />
    </MemoryRouter>,
  );
}

describe('MembersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentRole.mockReturnValue('ADMIN');
    hasValidAccessSession.mockReturnValue(true);
    getCurrentEmail.mockReturnValue('admin@library.com');
    getAccessTokenExpiresAt.mockReturnValue(null);
    searchMembers.mockResolvedValue(pageOf([ada, grace]));
    createMember.mockResolvedValue(ada);
    updateMember.mockResolvedValue(ada);
    deleteMember.mockResolvedValue(undefined);
  });

  it('lets an ADMIN load members and see management actions', async () => {
    renderMembersPage();

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@library.com')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(searchMembers).toHaveBeenCalledWith({ page: 0, size: 20, sort: 'name,asc' });
    expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Ada Lovelace' })).toBeInTheDocument();
  });

  it('shows a muted placeholder when name duplicates email', async () => {
    searchMembers.mockResolvedValue(pageOf([unnamed]));
    renderMembersPage();

    expect(await screen.findByText('No name set')).toBeInTheDocument();
    expect(screen.getByText('attach-admin@library.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit attach-admin@library.com' })).toBeInTheDocument();
  });

  it('does not show Members in USER navigation', () => {
    getCurrentRole.mockReturnValue('USER');
    expect(getNavItems('USER').map((item) => item.to)).not.toContain('/members');
    expect(getNavItems('ADMIN').map((item) => item.to)).toContain('/members');

    render(
      <MemoryRouter>
        <AppSidebar id="nav" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Members' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Books' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Authors' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Files' })).not.toBeInTheDocument();
  });

  it('redirects an authenticated USER away from /members', async () => {
    getCurrentRole.mockReturnValue('USER');
    getCurrentEmail.mockReturnValue('user@library.com');

    render(
      <MemoryRouter initialEntries={['/members']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(searchMembers).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Add Member' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Members' })).not.toBeInTheDocument();
  });

  it('paginates with a server-side request', async () => {
    searchMembers.mockResolvedValue(
      pageOf([ada], { totalPages: 2, totalElements: 21, last: false, numberOfElements: 1 }),
    );
    const user = userEvent.setup();
    renderMembersPage();

    await screen.findByText('Ada Lovelace');
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(searchMembers).toHaveBeenLastCalledWith({ page: 1, size: 20, sort: 'name,asc' });
    });
  });

  it('changes sort through the API and resets to page 0', async () => {
    const user = userEvent.setup();
    renderMembersPage('/members?page=1&sort=name,asc');

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /Name/ }));

    await waitFor(() => {
      expect(searchMembers).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'name,desc' });
    });

    await user.click(screen.getByRole('button', { name: /Email/ }));

    await waitFor(() => {
      expect(searchMembers).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'email,asc' });
    });
  });

  it('searches members by name or email with debounce', async () => {
    searchMembers.mockResolvedValueOnce(pageOf([ada, grace])).mockResolvedValueOnce(pageOf([ada]));
    const user = userEvent.setup();
    renderMembersPage();

    await screen.findByText('Ada Lovelace');
    await user.type(screen.getByPlaceholderText('Search by name or email'), 'Ada');

    await waitFor(() => {
      expect(searchMembers).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sort: 'name,asc',
        q: 'Ada',
      });
    });
  });

  it('creates a member with POST /members and refetches', async () => {
    const user = userEvent.setup();
    renderMembersPage();

    await user.click(await screen.findByRole('button', { name: 'Add Member' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Name'), 'Alan Turing');
    await user.type(within(dialog).getByLabelText('Email'), 'alan@library.com');
    await user.click(within(dialog).getByRole('button', { name: 'Create member' }));

    await waitFor(() => {
      expect(createMember).toHaveBeenCalledWith({ name: 'Alan Turing', email: 'alan@library.com' });
    });
    expect(await screen.findByText('Member created successfully.')).toBeInTheDocument();
    expect(searchMembers).toHaveBeenCalledTimes(2);
  });

  it('shows validation when create is submitted empty', async () => {
    const user = userEvent.setup();
    renderMembersPage();

    await user.click(await screen.findByRole('button', { name: 'Add Member' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Create member' }));

    expect(within(dialog).getByText('Name is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Email is required')).toBeInTheDocument();
    expect(createMember).not.toHaveBeenCalled();
  });

  it('edits a member with PUT /members/{id} and refetches', async () => {
    const user = userEvent.setup();
    renderMembersPage();

    await user.click(await screen.findByRole('button', { name: 'Edit Ada Lovelace' }));
    const dialog = screen.getByRole('dialog');
    const nameField = within(dialog).getByLabelText('Name');
    await user.clear(nameField);
    await user.type(nameField, 'Ada Lovelace Updated');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateMember).toHaveBeenCalledWith(3, {
        name: 'Ada Lovelace Updated',
        email: 'ada@library.com',
      });
    });
    expect(await screen.findByText('Member updated successfully.')).toBeInTheDocument();
    expect(searchMembers).toHaveBeenCalledTimes(2);
  });

  it('shows delete confirmation with active loan warning, then deletes and refetches', async () => {
    const user = userEvent.setup();
    renderMembersPage();

    await user.click(await screen.findByRole('button', { name: 'Delete Grace Hopper' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Delete member?' })).toBeInTheDocument();
    expect(within(dialog).getByText('Grace Hopper')).toBeInTheDocument();
    expect(within(dialog).getByText(/2 active loans/i)).toBeInTheDocument();
    expect(deleteMember).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Delete member' }));

    await waitFor(() => {
      expect(deleteMember).toHaveBeenCalledWith(4);
    });
    expect(await screen.findByText('Member deleted successfully.')).toBeInTheDocument();
    expect(searchMembers).toHaveBeenCalledTimes(2);
  });

  it('shows a friendly message when delete fails due to active loans', async () => {
    deleteMember.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-15T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Data integrity violation',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderMembersPage();

    await user.click(await screen.findByRole('button', { name: 'Delete Grace Hopper' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete member' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Can't delete this member — they still have an active loan. Return the book first, then try again.",
    );
    expect(screen.queryByText('Member deleted successfully.')).not.toBeInTheDocument();
    expect(screen.queryByText('Data integrity violation')).not.toBeInTheDocument();
  });

  it('shows a friendly message when delete fails due to borrow history', async () => {
    deleteMember.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-15T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Data integrity violation',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderMembersPage();

    await user.click(await screen.findByRole('button', { name: 'Delete Ada Lovelace' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete member' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Can't delete this member — they still have borrow history linked to their account.",
    );
    expect(screen.queryByText('Member deleted successfully.')).not.toBeInTheDocument();
  });

  it('moves to the previous page after deleting the last item on a later page', async () => {
    searchMembers.mockResolvedValue(
      pageOf([ada], { number: 1, totalPages: 2, totalElements: 21, first: false, last: true }),
    );
    const user = userEvent.setup();
    renderMembersPage('/members?page=1&sort=name,asc');

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete member' }));

    await waitFor(() => {
      expect(deleteMember).toHaveBeenCalledWith(3);
    });
    await waitFor(() => {
      expect(searchMembers).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'name,asc' });
    });
  });

  it('shows the list ApiError.message and retries', async () => {
    searchMembers
      .mockRejectedValueOnce(
        new ApiError({
          timestamp: '2026-08-15T00:00:00Z',
          status: 403,
          error: 'Forbidden',
          message: 'Access denied',
          fieldErrors: null,
        }),
      )
      .mockResolvedValueOnce(pageOf([ada]));
    const user = userEvent.setup();
    renderMembersPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(searchMembers).toHaveBeenCalledTimes(2);
  });
});
