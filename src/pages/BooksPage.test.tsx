import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import type { BookDto, MemberDto, Page } from '../types/api';
import { BooksPage } from './BooksPage';

const {
  getCurrentRole,
  listBooks,
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
  listMembers,
  borrowBook,
  borrowOwnBook,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  listBooks: vi.fn(),
  searchBooks: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
  listMembers: vi.fn(),
  borrowBook: vi.fn(),
  borrowOwnBook: vi.fn(),
}));

vi.mock('../auth/session', () => ({ getCurrentRole }));
vi.mock('../api/books', () => ({
  listBooks,
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
}));
vi.mock('../api/members', () => ({ listMembers, borrowBook }));
vi.mock('../api/user', () => ({ borrowOwnBook, getUserProfile: vi.fn() }));
vi.mock('../api/authors', () => ({
  listAuthors: vi.fn().mockResolvedValue({
    content: [{ id: 1, name: 'Robert C. Martin' }],
    totalElements: 1,
    totalPages: 1,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: false,
    numberOfElements: 1,
    pageable: {
      pageNumber: 0,
      pageSize: 50,
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

const availableBook: BookDto = {
  id: 9,
  title: 'Clean Code',
  isbn: '9780132350884',
  publishedYear: 2008,
  authorId: 1,
  available: true,
};

const unavailableBook: BookDto = {
  id: 10,
  title: 'Effective Java',
  isbn: '9780134685991',
  publishedYear: 2018,
  authorId: 1,
  available: false,
};

const member: MemberDto = {
  id: 3,
  name: 'Ada Lovelace',
  email: 'ada@library.com',
};

function pageOf(content: BookDto[]): Page<BookDto> {
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
      sort: { empty: true, sorted: false, unsorted: true },
    },
    sort: { empty: true, sorted: false, unsorted: true },
  };
}

function renderBooksPage() {
  return render(
    <MemoryRouter initialEntries={['/books']}>
      <BooksPage />
    </MemoryRouter>,
  );
}

describe('BooksPage borrow flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listBooks.mockResolvedValue(pageOf([availableBook]));
    searchBooks.mockResolvedValue(pageOf([availableBook]));
    listMembers.mockResolvedValue({
      ...pageOf([]),
      content: [member],
      totalElements: 1,
      numberOfElements: 1,
      empty: false,
    });
    borrowBook.mockResolvedValue(undefined);
    borrowOwnBook.mockResolvedValue(undefined);
  });

  it('lets a USER borrow an available book without loading members or seeing catalogue management actions', async () => {
    getCurrentRole.mockReturnValue('USER');
    const user = userEvent.setup();
    renderBooksPage();

    expect(await screen.findByRole('button', { name: 'Borrow' })).toBeInTheDocument();
    expect(within(screen.getByText('Clean Code').closest('tr') as HTMLElement).getByText('Available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Book' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Borrow' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Borrow this book?' })).toBeInTheDocument();
    expect(within(dialog).getByText('Clean Code')).toBeInTheDocument();
    expect(listMembers).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Borrow' }));

    await waitFor(() => {
      expect(borrowOwnBook).toHaveBeenCalledWith(9);
    });
    expect(borrowBook).not.toHaveBeenCalled();
    expect(await screen.findByText('Book borrowed successfully.')).toBeInTheDocument();
    expect(listBooks).toHaveBeenCalledTimes(2);
  });

  it('does not let a USER borrow an unavailable book', async () => {
    getCurrentRole.mockReturnValue('USER');
    listBooks.mockResolvedValue(pageOf([unavailableBook]));
    renderBooksPage();

    expect(await screen.findByText('Currently borrowed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrowed' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Borrow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(borrowOwnBook).not.toHaveBeenCalled();
  });

  it('refetches availability after a successful USER borrow', async () => {
    getCurrentRole.mockReturnValue('USER');
    listBooks
      .mockResolvedValueOnce(pageOf([availableBook]))
      .mockResolvedValueOnce(pageOf([{ ...availableBook, available: false }]));
    const user = userEvent.setup();
    renderBooksPage();

    await user.click(await screen.findByRole('button', { name: 'Borrow' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Borrow' }));

    expect(await screen.findByText('Currently borrowed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrowed' })).toBeDisabled();
  });

  it('shows the backend 409 message when a USER borrow is rejected', async () => {
    getCurrentRole.mockReturnValue('USER');
    borrowOwnBook.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-15T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Book is not available',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderBooksPage();

    await user.click(await screen.findByRole('button', { name: 'Borrow' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Borrow' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Book is not available');
    expect(screen.queryByText('Book borrowed successfully.')).not.toBeInTheDocument();
  });

  it('lets an ADMIN choose a member and use the member borrow endpoint', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    const user = userEvent.setup();
    renderBooksPage();

    expect(await screen.findByRole('button', { name: 'Add Book' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(within(screen.getByText('Clean Code').closest('tr') as HTMLElement).getByText('Available')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Borrow' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Borrow book' })).toBeInTheDocument();
    await waitFor(() => {
      expect(listMembers).toHaveBeenCalled();
    });

    await user.selectOptions(within(dialog).getByLabelText('Member'), '3');
    await user.click(within(dialog).getByRole('button', { name: 'Borrow' }));

    await waitFor(() => {
      expect(borrowBook).toHaveBeenCalledWith(3, 9);
    });
    expect(borrowOwnBook).not.toHaveBeenCalled();
    expect(await screen.findByText('Book borrowed successfully.')).toBeInTheDocument();
    expect(listBooks).toHaveBeenCalledTimes(2);
  });

  it('keeps Edit and Delete for ADMIN when a book is unavailable', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    listBooks.mockResolvedValue(pageOf([unavailableBook]));
    renderBooksPage();

    expect(await screen.findByText('Currently borrowed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrowed' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Add Book' })).toBeInTheDocument();
    expect(borrowBook).not.toHaveBeenCalled();
  });

  it('does not let ADMIN edit availability in the book form', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    const user = userEvent.setup();
    renderBooksPage();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByLabelText('Availability')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('sends available=true and available=false to the search API', async () => {
    getCurrentRole.mockReturnValue('USER');
    const user = userEvent.setup();
    renderBooksPage();
    await screen.findByText('Clean Code');

    await user.selectOptions(screen.getByLabelText('Availability'), 'true');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(searchBooks).toHaveBeenCalledWith(expect.objectContaining({ available: true }));
    });

    await user.selectOptions(screen.getByLabelText('Availability'), 'false');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(searchBooks).toHaveBeenLastCalledWith(expect.objectContaining({ available: false }));
    });
  });
});
