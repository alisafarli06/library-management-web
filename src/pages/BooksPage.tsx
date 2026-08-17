import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  attachBookCover,
  attachBookPreface,
  createBook,
  deleteBook,
  listBooks,
  removeBookCover,
  removeBookPreface,
  searchBooks,
  updateBook,
} from '../api/books';
import { borrowBook } from '../api/members';
import { borrowOwnBook } from '../api/user';
import { getCurrentRole } from '../auth/session';
import { errorMessage } from '../components/auth/formErrors';
import { BookBorrowDialog } from '../components/books/BookBorrowDialog';
import { BookConfirmDialog } from '../components/books/BookConfirmDialog';
import { BookDetailsDialog } from '../components/books/BookDetailsDialog';
import { BookFilters } from '../components/books/BookFilters';
import {
  BookForm,
  EMPTY_BOOK_FORM,
  bookToFormValues,
  type BookAttachmentDraft,
  type BookFormValues,
} from '../components/books/BookForm';
import { BookPagination } from '../components/books/BookPagination';
import { BookTable } from '../components/books/BookTable';
import {
  DEFAULT_BOOK_LIST_QUERY,
  authorFilterLabel,
  bookListQueryToSearchParams,
  clearAuthorFilter,
  hasActiveFilters,
  parseBookListQuery,
  parseOptionalYear,
  type BookListQuery,
  type BookSortField,
} from '../components/books/bookListQuery';
import '../components/books/books.css';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type { BookDto, BookSearchQuery, Page } from '../types/api';

function toApiQuery(query: BookListQuery): BookSearchQuery {
  const available =
    query.available === 'true' ? true : query.available === 'false' ? false : undefined;
  const authorId = query.authorId ? Number.parseInt(query.authorId, 10) : undefined;

  return {
    page: query.page,
    size: query.size,
    sort: `${query.sortField},${query.sortDirection}`,
    title: query.title || undefined,
    authorId: Number.isInteger(authorId) ? authorId : undefined,
    author: !query.authorId && query.author ? query.author : undefined,
    yearFrom: parseOptionalYear(query.yearFrom),
    yearTo: parseOptionalYear(query.yearTo),
    available,
  };
}

export function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseBookListQuery(searchParams), [searchParams]);
  const [draftQuery, setDraftQuery] = useState<BookListQuery>(appliedQuery);
  const [result, setResult] = useState<Page<BookDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [editor, setEditor] = useState<{
    mode: 'create' | 'edit';
    bookId?: number;
    values: BookFormValues;
    book?: BookDto;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [borrowBookTarget, setBorrowBookTarget] = useState<BookDto | null>(null);
  const [detailsBook, setDetailsBook] = useState<BookDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookDto | null>(null);
  const canManageBooks = getCurrentRole() === 'ADMIN';

  useEffect(() => {
    setDraftQuery(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadBooks() {
      setLoading(true);
      setError(null);
      const apiQuery = toApiQuery(appliedQuery);

      try {
        const page = hasActiveFilters(appliedQuery)
          ? await searchBooks(apiQuery)
          : await listBooks({
              page: apiQuery.page,
              size: apiQuery.size,
              sort: apiQuery.sort,
            });
        if (!cancelled) {
          setResult(page);
        }
      } catch (loadError) {
        if (!cancelled) {
          setResult(null);
          setError(errorMessage(loadError, 'Unable to load books.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBooks();
    return () => {
      cancelled = true;
    };
  }, [appliedQuery, reloadToken]);

  function replaceQuery(next: BookListQuery) {
    setSearchParams(bookListQueryToSearchParams(next), { replace: true });
  }

  function applyFilters() {
    const next = { ...draftQuery, page: 0 };
    if (next.authorId && next.author.trim() !== next.authorName.trim()) {
      next.authorId = '';
      next.authorName = '';
    }
    replaceQuery(next);
  }

  function clearFilters() {
    replaceQuery({
      ...DEFAULT_BOOK_LIST_QUERY,
      sortField: appliedQuery.sortField,
      sortDirection: appliedQuery.sortDirection,
    });
  }

  function dismissAuthorFilter() {
    replaceQuery(clearAuthorFilter(appliedQuery));
  }

  function changeSort(field: BookSortField) {
    const sortDirection =
      appliedQuery.sortField === field && appliedQuery.sortDirection === 'asc' ? 'desc' : 'asc';
    replaceQuery({ ...appliedQuery, page: 0, sortField: field, sortDirection });
  }

  function closeEditor() {
    if (!submitting) {
      setEditor(null);
    }
  }

  async function handleSave(book: BookDto, attachments: BookAttachmentDraft) {
    if (!canManageBooks || !editor || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      let saved: BookDto;
      if (editor.mode === 'create') {
        saved = await createBook(book);
        setSuccessMessage('Book created successfully.');
      } else if (editor.bookId != null) {
        saved = await updateBook(editor.bookId, book);
        setSuccessMessage('Book updated successfully.');
      } else {
        throw new Error('Unable to save the book.');
      }
      if (saved.id == null) {
        throw new Error('Unable to save the book.');
      }
      const bookId = saved.id;
      if (attachments.removeCover) {
        saved = await removeBookCover(bookId);
      } else if (attachments.coverFile) {
        saved = await attachBookCover(bookId, attachments.coverFile);
      }
      if (attachments.removePreface) {
        saved = await removeBookPreface(bookId);
      } else if (attachments.prefaceFile) {
        saved = await attachBookPreface(bookId, attachments.prefaceFile);
      }
      void saved;
      setEditor(null);
      setReloadToken((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminBorrow(memberId: number) {
    if (!canManageBooks || !borrowBookTarget?.id || borrowBookTarget.available !== true || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await borrowBook(memberId, borrowBookTarget.id);
      setSuccessMessage('Book borrowed successfully.');
      setBorrowBookTarget(null);
      setReloadToken((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUserBorrow() {
    if (canManageBooks || !borrowBookTarget?.id || borrowBookTarget.available !== true || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await borrowOwnBook(borrowBookTarget.id);
      setSuccessMessage('Book borrowed successfully.');
      setBorrowBookTarget(null);
      setReloadToken((value) => value + 1);
    } catch (error) {
      setActionError(errorMessage(error, 'Unable to borrow the book.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!canManageBooks || !deleteTarget?.id || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await deleteBook(deleteTarget.id);
      setSuccessMessage('Book deleted successfully.');
      setDeleteTarget(null);
      if ((result?.content.length ?? 0) === 1 && appliedQuery.page > 0) {
        replaceQuery({ ...appliedQuery, page: appliedQuery.page - 1 });
      } else {
        setReloadToken((value) => value + 1);
      }
    } catch (error) {
      setActionError(errorMessage(error, 'Unable to delete the book.'));
    } finally {
      setSubmitting(false);
    }
  }

  const books = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;
  const activeAuthorFilter = authorFilterLabel(appliedQuery);

  return (
    <div className="book-page">
      <div className="book-page__toolbar">
        <PageHeader
          title="Books"
          description="Browse the catalogue. Search uses the API title, author name, year range, and availability filters."
        />
        {canManageBooks ? (
          <Button
            type="button"
            onClick={() => {
              setSuccessMessage(null);
              setActionError(null);
              setEditor({ mode: 'create', values: EMPTY_BOOK_FORM });
            }}
          >
            Add Book
          </Button>
        ) : null}
      </div>

      {successMessage ? (
        <p className="book-success" role="status">
          {successMessage}
        </p>
      ) : null}

      <Card>
        {activeAuthorFilter ? (
          <div className="book-filter-chips" role="status" aria-live="polite">
            <span className="book-filter-chip">
              Author: {activeAuthorFilter}
              <button
                type="button"
                className="book-filter-chip__clear"
                aria-label={`Clear author filter for ${activeAuthorFilter}`}
                onClick={dismissAuthorFilter}
              >
                ×
              </button>
            </span>
          </div>
        ) : null}
        <BookFilters
          value={draftQuery}
          disabled={loading}
          onChange={setDraftQuery}
          onSubmit={applyFilters}
          onClear={clearFilters}
        />
      </Card>

      {error ? (
        <div>
          <p className="book-alert" role="alert">
            {error}
          </p>
          <div className="book-empty-action">
            <Button type="button" variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {!error && !loading && books.length === 0 ? (
        <EmptyState
          title="No books match the current filters."
          body="Clear the search or adjust title, author, year, or availability and search again."
        />
      ) : null}

      {!error && !loading && books.length === 0 && hasActiveFilters(appliedQuery) ? (
        <div className="book-empty-action">
          <Button type="button" variant="secondary" onClick={clearFilters}>
            Reset filters
          </Button>
        </div>
      ) : null}

      {!error && (loading || books.length > 0) ? (
        <Card>
          <BookTable
            books={books}
            sortField={appliedQuery.sortField}
            sortDirection={appliedQuery.sortDirection}
            loading={loading}
            canManage={canManageBooks}
            onSort={changeSort}
            onDetails={(book) => {
              if (book.id == null) {
                return;
              }
              setSuccessMessage(null);
              setActionError(null);
              setDetailsBook(book);
            }}
            onEdit={(book) => {
              if (!canManageBooks || book.id == null) {
                return;
              }
              setSuccessMessage(null);
              setActionError(null);
              setEditor({ mode: 'edit', bookId: book.id, values: bookToFormValues(book), book });
            }}
            onDelete={(book) => {
              if (!canManageBooks || book.id == null) {
                return;
              }
              setSuccessMessage(null);
              setActionError(null);
              setDeleteTarget(book);
            }}
            onBorrow={(book) => {
              if (book.id == null || book.available !== true) {
                return;
              }
              setSuccessMessage(null);
              setActionError(null);
              setBorrowBookTarget(book);
            }}
          />
          <BookPagination
            page={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            disabled={loading}
            onPrevious={() => replaceQuery({ ...appliedQuery, page: Math.max(appliedQuery.page - 1, 0) })}
            onNext={() => replaceQuery({ ...appliedQuery, page: appliedQuery.page + 1 })}
          />
        </Card>
      ) : null}

      {canManageBooks && editor ? (
        <BookForm
          mode={editor.mode}
          initialValues={editor.values}
          existingBook={editor.book ?? null}
          submitting={submitting}
          onSubmit={handleSave}
          onCancel={closeEditor}
        />
      ) : null}

      {detailsBook ? (
        <BookDetailsDialog
          book={detailsBook}
          canManage={canManageBooks}
          submitting={submitting}
          onBorrow={() => {
            if (detailsBook.available !== true) {
              return;
            }
            setDetailsBook(null);
            setBorrowBookTarget(detailsBook);
          }}
          onEdit={() => {
            if (!canManageBooks || detailsBook.id == null) {
              return;
            }
            setDetailsBook(null);
            setEditor({
              mode: 'edit',
              bookId: detailsBook.id,
              values: bookToFormValues(detailsBook),
              book: detailsBook,
            });
          }}
          onDelete={() => {
            if (!canManageBooks) {
              return;
            }
            setDetailsBook(null);
            setDeleteTarget(detailsBook);
          }}
          onClose={() => {
            if (!submitting) {
              setDetailsBook(null);
            }
          }}
        />
      ) : null}

      {canManageBooks && borrowBookTarget ? (
        <BookBorrowDialog
          book={borrowBookTarget}
          submitting={submitting}
          onSubmit={handleAdminBorrow}
          onCancel={() => {
            if (!submitting) {
              setBorrowBookTarget(null);
            }
          }}
        />
      ) : null}

      {!canManageBooks && borrowBookTarget ? (
        <BookConfirmDialog
          title="Borrow this book?"
          confirmLabel="Borrow"
          submitting={submitting}
          onConfirm={() => {
            void handleUserBorrow();
          }}
          onCancel={() => {
            if (!submitting) {
              setBorrowBookTarget(null);
              setActionError(null);
            }
          }}
        >
          <p className="book-form__hint">
            Borrow <strong>{borrowBookTarget.title}</strong> for your library account?
          </p>
          {actionError ? (
            <p className="book-alert" role="alert">
              {actionError}
            </p>
          ) : null}
        </BookConfirmDialog>
      ) : null}

      {canManageBooks && deleteTarget ? (
        <BookConfirmDialog
          title="Delete book"
          confirmLabel="Delete book"
          submitting={submitting}
          onConfirm={() => {
            void handleDelete();
          }}
          onCancel={() => {
            if (!submitting) {
              setDeleteTarget(null);
              setActionError(null);
            }
          }}
        >
          <p className="book-form__hint">
            Delete <strong>{deleteTarget.title}</strong>? This cannot be undone from this screen.
          </p>
          {actionError ? (
            <p className="book-alert" role="alert">
              {actionError}
            </p>
          ) : null}
        </BookConfirmDialog>
      ) : null}
    </div>
  );
}
