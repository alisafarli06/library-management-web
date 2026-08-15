import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listBooks, searchBooks } from '../api/books';
import { errorMessage } from '../components/auth/formErrors';
import { BookFilters } from '../components/books/BookFilters';
import { BookPagination } from '../components/books/BookPagination';
import { BookTable } from '../components/books/BookTable';
import {
  DEFAULT_BOOK_LIST_QUERY,
  bookListQueryToSearchParams,
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

  return {
    page: query.page,
    size: query.size,
    sort: `${query.sortField},${query.sortDirection}`,
    title: query.title || undefined,
    author: query.author || undefined,
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
    replaceQuery({ ...draftQuery, page: 0 });
  }

  function clearFilters() {
    replaceQuery({
      ...DEFAULT_BOOK_LIST_QUERY,
      sortField: appliedQuery.sortField,
      sortDirection: appliedQuery.sortDirection,
    });
  }

  function changeSort(field: BookSortField) {
    const sortDirection =
      appliedQuery.sortField === field && appliedQuery.sortDirection === 'asc' ? 'desc' : 'asc';
    replaceQuery({ ...appliedQuery, page: 0, sortField: field, sortDirection });
  }

  const books = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;

  return (
    <div className="book-page">
      <PageHeader
        title="Books"
        description="Browse the catalogue. Search uses the API title, author name, year range, and availability filters."
      />

      <Card>
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
            onSort={changeSort}
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
    </div>
  );
}
