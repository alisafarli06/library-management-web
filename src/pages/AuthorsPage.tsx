import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createAuthor, deleteAuthor, searchAuthors, updateAuthor } from '../api/authors';
import { getCurrentRole } from '../auth/session';
import { errorMessage } from '../components/auth/formErrors';
import { AuthorForm } from '../components/authors/AuthorForm';
import { AuthorPagination } from '../components/authors/AuthorPagination';
import { AuthorTable } from '../components/authors/AuthorTable';
import {
  authorListQueryToSearchParams,
  authorQueryHasSearch,
  nextAuthorSort,
  parseAuthorListQuery,
  toAuthorApiQuery,
  type AuthorListQuery,
} from '../components/authors/authorListQuery';
import { BookConfirmDialog } from '../components/books/BookConfirmDialog';
import '../components/books/books.css';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type { AuthorDto, Page } from '../types/api';

const SEARCH_DEBOUNCE_MS = 350;

export function AuthorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseAuthorListQuery(searchParams), [searchParams]);
  const [result, setResult] = useState<Page<AuthorDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchInput, setSearchInput] = useState(appliedQuery.q);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; authorId?: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuthorDto | null>(null);
  const canManageAuthors = getCurrentRole() === 'ADMIN';

  useEffect(() => {
    setSearchInput(appliedQuery.q);
  }, [appliedQuery.q]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === appliedQuery.q) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSearchParams(
        authorListQueryToSearchParams({
          ...appliedQuery,
          page: 0,
          q: trimmed,
        }),
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchInput, appliedQuery, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthors() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchAuthors(toAuthorApiQuery(appliedQuery));
        if (!cancelled) {
          setResult(page);
        }
      } catch (loadError) {
        if (!cancelled) {
          setResult(null);
          setError(errorMessage(loadError, 'Unable to load authors.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAuthors();
    return () => {
      cancelled = true;
    };
  }, [appliedQuery, reloadToken]);

  function replaceQuery(next: AuthorListQuery) {
    setSearchParams(authorListQueryToSearchParams(next), { replace: true });
  }

  function closeEditor() {
    if (!submitting) {
      setEditor(null);
    }
  }

  async function handleSave(author: AuthorDto) {
    if (!canManageAuthors || !editor || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      if (editor.mode === 'create') {
        await createAuthor(author);
        setSuccessMessage('Author created successfully.');
      } else if (editor.authorId != null) {
        await updateAuthor(editor.authorId, author);
        setSuccessMessage('Author updated successfully.');
      } else {
        throw new Error('Unable to save the author.');
      }
      setEditor(null);
      setReloadToken((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!canManageAuthors || !deleteTarget?.id || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await deleteAuthor(deleteTarget.id);
      setSuccessMessage('Author deleted successfully.');
      setDeleteTarget(null);
      if ((result?.content.length ?? 0) === 1 && appliedQuery.page > 0) {
        replaceQuery({ ...appliedQuery, page: appliedQuery.page - 1 });
      } else {
        setReloadToken((value) => value + 1);
      }
    } catch (deleteError) {
      setActionError(errorMessage(deleteError, 'Unable to delete the author.'));
    } finally {
      setSubmitting(false);
    }
  }

  const authors = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;
  const hasSearch = authorQueryHasSearch(appliedQuery);
  const hasLoadedEmptyCatalogue = !loading && !error && authors.length === 0 && !hasSearch && result != null;
  const hasFilteredEmpty = !loading && !error && authors.length === 0 && hasSearch;
  const showResultsCard = !error && (loading || authors.length > 0 || hasSearch);

  return (
    <div className="book-page">
      <div className="book-page__toolbar">
        <PageHeader title="Authors" description="Browse authors referenced by books in the catalogue." />
        {canManageAuthors ? (
          <Button
            type="button"
            onClick={() => {
              setSuccessMessage(null);
              setActionError(null);
              setEditor({ mode: 'create', name: '' });
            }}
          >
            Add Author
          </Button>
        ) : null}
      </div>

      {successMessage ? (
        <p className="book-success" role="status">
          {successMessage}
        </p>
      ) : null}

      {error ? (
        <div>
          <p className="book-alert" role="alert">
            {error}
          </p>
          <div className="book-form__actions">
            <Button type="button" variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {hasLoadedEmptyCatalogue ? (
        <EmptyState title="No authors found." body="There are no author records to display yet." />
      ) : null}

      {showResultsCard ? (
        <Card>
          <div className="book-toolbar">
            <label className="book-search">
              <span className="book-search__label">
                Search
                {loading ? <span className="book-search__spinner" aria-hidden="true" /> : null}
              </span>
              <input
                type="search"
                value={searchInput}
                placeholder="Search by author name"
                autoComplete="off"
                aria-busy={loading || undefined}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>
          </div>
          {hasFilteredEmpty ? (
            <EmptyState title="No authors match your search." body="Try a different author name." />
          ) : (
            <div className={loading ? 'book-table-loading' : undefined}>
              <AuthorTable
                authors={authors}
                sortField={appliedQuery.sortField}
                sortDirection={appliedQuery.sortDirection}
                loading={loading}
                canManage={canManageAuthors}
                onSort={(field) => replaceQuery(nextAuthorSort(appliedQuery, field))}
                onEdit={(author) => {
                  if (!canManageAuthors || author.id == null) {
                    return;
                  }
                  setSuccessMessage(null);
                  setActionError(null);
                  setEditor({ mode: 'edit', authorId: author.id, name: author.name });
                }}
                onDelete={(author) => {
                  if (!canManageAuthors || author.id == null) {
                    return;
                  }
                  setSuccessMessage(null);
                  setActionError(null);
                  setDeleteTarget(author);
                }}
              />
            </div>
          )}
          <AuthorPagination
            page={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            disabled={loading}
            onPrevious={() => replaceQuery({ ...appliedQuery, page: Math.max(appliedQuery.page - 1, 0) })}
            onNext={() => replaceQuery({ ...appliedQuery, page: appliedQuery.page + 1 })}
          />
        </Card>
      ) : null}

      {canManageAuthors && editor ? (
        <AuthorForm
          mode={editor.mode}
          initialName={editor.name}
          submitting={submitting}
          onSubmit={handleSave}
          onCancel={closeEditor}
        />
      ) : null}

      {canManageAuthors && deleteTarget ? (
        <BookConfirmDialog
          title="Delete author?"
          confirmLabel="Delete author"
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
            Delete <strong>{deleteTarget.name}</strong>?
            {(deleteTarget.bookCount ?? 0) > 0
              ? ` This author has ${deleteTarget.bookCount} linked book${deleteTarget.bookCount === 1 ? '' : 's'}.`
              : null}{' '}
            Deletion is blocked while books still reference this author — reassign or remove those books first. This
            cannot be undone from this screen.
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
