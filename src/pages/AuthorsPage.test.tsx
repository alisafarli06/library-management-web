import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { AuthorDto, Page } from '../types/api';
import { AuthorsPage } from './AuthorsPage';

const { getCurrentRole, searchAuthors, createAuthor, updateAuthor, deleteAuthor } = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  searchAuthors: vi.fn(),
  createAuthor: vi.fn(),
  updateAuthor: vi.fn(),
  deleteAuthor: vi.fn(),
}));

vi.mock('../auth/session', () => ({ getCurrentRole }));
vi.mock('../api/authors', () => ({
  searchAuthors,
  listAuthors: vi.fn(),
  createAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthor: vi.fn(),
}));

const austen: AuthorDto = { id: 1, name: 'Jane Austen', bookCount: 2 };
const tolstoy: AuthorDto = { id: 2, name: 'Leo Tolstoy', bookCount: 0 };

function pageOf(content: AuthorDto[], overrides: Partial<Page<AuthorDto>> = {}): Page<AuthorDto> {
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

function renderAuthorsPage(path = '/authors') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthorsPage />
    </MemoryRouter>,
  );
}

describe('AuthorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchAuthors.mockResolvedValue(pageOf([austen, tolstoy]));
    createAuthor.mockResolvedValue(austen);
    updateAuthor.mockResolvedValue(austen);
    deleteAuthor.mockResolvedValue(undefined);
  });

  it('lets a USER load authors without management actions', async () => {
    getCurrentRole.mockReturnValue('USER');
    renderAuthorsPage();

    expect(await screen.findByText('Jane Austen')).toBeInTheDocument();
    expect(screen.getByText('Leo Tolstoy')).toBeInTheDocument();
    expect(searchAuthors).toHaveBeenCalledWith({ page: 0, size: 20, sort: 'name,asc' });
    expect(screen.queryByRole('button', { name: 'Add Author' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Jane Austen' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Jane Austen' })).not.toBeInTheDocument();
  });

  it('lets an ADMIN see Add, Edit, and Delete', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    renderAuthorsPage();

    expect(await screen.findByRole('button', { name: 'Add Author' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Jane Austen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Jane Austen' })).toBeInTheDocument();
  });

  it('shows linked book counts', async () => {
    getCurrentRole.mockReturnValue('USER');
    renderAuthorsPage();

    await screen.findByText('Jane Austen');
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('2')).toBeInTheDocument();
    expect(within(rows[2]).getByText('0')).toBeInTheDocument();
  });

  it('paginates with a server-side request', async () => {
    getCurrentRole.mockReturnValue('USER');
    searchAuthors.mockResolvedValue(
      pageOf([austen], { totalPages: 2, totalElements: 21, last: false, numberOfElements: 1 }),
    );
    const user = userEvent.setup();
    renderAuthorsPage();

    await screen.findByText('Jane Austen');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(searchAuthors).toHaveBeenLastCalledWith({ page: 1, size: 20, sort: 'name,asc' });
    });
  });

  it('changes sort through the API and resets to page 0', async () => {
    getCurrentRole.mockReturnValue('USER');
    const user = userEvent.setup();
    renderAuthorsPage('/authors?page=1&sort=name,asc');

    await screen.findByText('Jane Austen');
    await user.click(screen.getByRole('button', { name: /Name/ }));

    await waitFor(() => {
      expect(searchAuthors).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'name,desc' });
    });
  });

  it('sorts by Books and ID via the API', async () => {
    getCurrentRole.mockReturnValue('USER');
    const user = userEvent.setup();
    renderAuthorsPage();

    await screen.findByText('Jane Austen');
    await user.click(screen.getByRole('button', { name: /Books/ }));

    await waitFor(() => {
      expect(searchAuthors).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'bookCount,asc' });
    });

    await user.click(screen.getByRole('button', { name: /ID/ }));

    await waitFor(() => {
      expect(searchAuthors).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'id,asc' });
    });
  });

  it('shows pagination controls below the table', async () => {
    getCurrentRole.mockReturnValue('USER');
    searchAuthors.mockResolvedValue(
      pageOf([austen], { totalPages: 2, totalElements: 21, last: false, numberOfElements: 1 }),
    );
    renderAuthorsPage();

    await screen.findByText('Jane Austen');
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('searches authors by name with debounce', async () => {
    getCurrentRole.mockReturnValue('USER');
    searchAuthors
      .mockResolvedValueOnce(pageOf([austen, tolstoy]))
      .mockResolvedValueOnce(pageOf([austen]));
    const user = userEvent.setup();
    renderAuthorsPage();

    await screen.findByText('Jane Austen');
    await user.type(screen.getByPlaceholderText('Search by author name'), 'Jane');

    await waitFor(() => {
      expect(searchAuthors).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sort: 'name,asc',
        q: 'Jane',
      });
    });
  });

  it('creates an author with POST /authors and refetches', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    const user = userEvent.setup();
    renderAuthorsPage();

    await user.click(await screen.findByRole('button', { name: 'Add Author' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Name'), 'Chinua Achebe');
    await user.click(within(dialog).getByRole('button', { name: 'Create author' }));

    await waitFor(() => {
      expect(createAuthor).toHaveBeenCalledWith({ name: 'Chinua Achebe' });
    });
    expect(await screen.findByText('Author created successfully.')).toBeInTheDocument();
    expect(searchAuthors).toHaveBeenCalledTimes(2);
  });

  it('shows validation when create is submitted empty', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    const user = userEvent.setup();
    renderAuthorsPage();

    await user.click(await screen.findByRole('button', { name: 'Add Author' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Create author' }));

    expect(within(dialog).getByText('Name is required')).toBeInTheDocument();
    expect(createAuthor).not.toHaveBeenCalled();
  });

  it('edits an author with PUT /authors/{id} and refetches', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    const user = userEvent.setup();
    renderAuthorsPage();

    await user.click(await screen.findByRole('button', { name: 'Edit Jane Austen' }));
    const dialog = screen.getByRole('dialog');
    const nameField = within(dialog).getByLabelText('Name');
    await user.clear(nameField);
    await user.type(nameField, 'Jane Austen Updated');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateAuthor).toHaveBeenCalledWith(1, { name: 'Jane Austen Updated' });
    });
    expect(await screen.findByText('Author updated successfully.')).toBeInTheDocument();
    expect(searchAuthors).toHaveBeenCalledTimes(2);
  });

  it('deletes an author with DELETE /authors/{id} and refetches', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    const user = userEvent.setup();
    renderAuthorsPage();

    await user.click(await screen.findByRole('button', { name: 'Delete Jane Austen' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Delete author?' })).toBeInTheDocument();
    expect(within(dialog).getByText('Jane Austen')).toBeInTheDocument();
    expect(within(dialog).getByText(/2 linked books/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Deletion is blocked while books still reference/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete author' }));

    await waitFor(() => {
      expect(deleteAuthor).toHaveBeenCalledWith(1);
    });
    expect(await screen.findByText('Author deleted successfully.')).toBeInTheDocument();
    expect(searchAuthors).toHaveBeenCalledTimes(2);
  });

  it('shows the backend 409 message when delete is rejected', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    deleteAuthor.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-15T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Data integrity violation',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderAuthorsPage();

    await user.click(await screen.findByRole('button', { name: 'Delete Jane Austen' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete author' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Data integrity violation');
    expect(screen.queryByText('Author deleted successfully.')).not.toBeInTheDocument();
  });
});
