import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { listAuthors } from '../../api/authors';
import { errorMessage, fieldErrorsFrom } from '../auth/formErrors';
import { Button } from '../ui/Primitives';
import type { AuthorDto, BookDto } from '../../types/api';

export interface BookFormValues {
  title: string;
  isbn: string;
  publishedYear: string;
  authorId: string;
}

interface BookFormProps {
  mode: 'create' | 'edit';
  initialValues: BookFormValues;
  submitting: boolean;
  onSubmit: (book: BookDto) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_AUTHORS: AuthorDto[] = [];

export function bookToFormValues(book: BookDto): BookFormValues {
  return {
    title: book.title,
    isbn: book.isbn,
    publishedYear: book.publishedYear == null ? '' : String(book.publishedYear),
    authorId: String(book.authorId),
  };
}

export const EMPTY_BOOK_FORM: BookFormValues = {
  title: '',
  isbn: '',
  publishedYear: '',
  authorId: '',
};

async function loadAllAuthors(): Promise<AuthorDto[]> {
  const pageSize = 50;
  const first = await listAuthors({ page: 0, size: pageSize, sort: 'name,asc' });
  const authors = [...first.content];
  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await listAuthors({ page, size: pageSize, sort: 'name,asc' });
    authors.push(...next.content);
  }
  return authors;
}

function validate(values: BookFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = values.title.trim();
  const isbn = values.isbn.trim();

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > 255) {
    errors.title = 'Title must be at most 255 characters.';
  }

  if (!isbn) {
    errors.isbn = 'ISBN is required.';
  } else if (isbn.length > 20) {
    errors.isbn = 'ISBN must be at most 20 characters.';
  }

  if (values.publishedYear.trim()) {
    const year = Number(values.publishedYear);
    if (!Number.isInteger(year) || year <= 0) {
      errors.publishedYear = 'Published year must be a positive number.';
    }
  }

  if (!values.authorId) {
    errors.authorId = 'Author is required.';
  }

  return errors;
}

function toBookDto(values: BookFormValues): BookDto {
  const year = values.publishedYear.trim();
  return {
    title: values.title.trim(),
    isbn: values.isbn.trim(),
    publishedYear: year ? Number(year) : null,
    authorId: Number(values.authorId),
  };
}

export function BookForm({ mode, initialValues, submitting, onSubmit, onCancel }: BookFormProps) {
  const titleId = useId();
  const isbnId = useId();
  const yearId = useId();
  const authorId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<BookFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<AuthorDto[]>(EMPTY_AUTHORS);
  const [authorsLoading, setAuthorsLoading] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [authorReload, setAuthorReload] = useState(0);

  useEffect(() => {
    titleRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthors() {
      setAuthorsLoading(true);
      setAuthorsError(null);
      try {
        const loaded = await loadAllAuthors();
        if (!cancelled) {
          setAuthors(loaded);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthors(EMPTY_AUTHORS);
          setAuthorsError(errorMessage(error, 'Unable to load authors.'));
        }
      } finally {
        if (!cancelled) {
          setAuthorsLoading(false);
        }
      }
    }

    void loadAuthors();
    return () => {
      cancelled = true;
    };
  }, [authorReload]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onCancel();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || authorsLoading || authorsError || authors.length === 0) {
      return;
    }

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    try {
      await onSubmit(toBookDto(values));
    } catch (error) {
      const backendFields = fieldErrorsFrom(error);
      const mapped: Record<string, string> = {};
      const unmapped: string[] = [];
      for (const [key, message] of Object.entries(backendFields)) {
        if (key === 'title' || key === 'isbn' || key === 'publishedYear' || key === 'authorId') {
          mapped[key] = message;
        } else {
          unmapped.push(`${key}: ${message}`);
        }
      }
      setFieldErrors(mapped);
      if (unmapped.length > 0) {
        setFormError(unmapped.join(' '));
      } else if (Object.keys(mapped).length === 0) {
        setFormError(errorMessage(error, 'Unable to save the book.'));
      } else {
        setFormError(null);
      }
    }
  }

  const heading = mode === 'create' ? 'Add book' : 'Edit book';
  const submitLabel = submitting
    ? mode === 'create'
      ? 'Creating…'
      : 'Saving…'
    : mode === 'create'
      ? 'Create book'
      : 'Save changes';
  const canSubmit = !submitting && !authorsLoading && !authorsError && authors.length > 0;

  return (
    <div className="book-dialog-root">
      <button
        type="button"
        className="book-dialog__backdrop"
        aria-label="Close dialog"
        disabled={submitting}
        onClick={() => {
          if (!submitting) {
            onCancel();
          }
        }}
      />
      <div
        className="book-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${titleId}-heading`}
      >
        <h2 id={`${titleId}-heading`}>{heading}</h2>
        <form className="book-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="book-alert" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="book-form__field" htmlFor={titleId}>
            Title
            <input
              ref={titleRef}
              id={titleId}
              value={values.title}
              maxLength={255}
              disabled={submitting}
              aria-invalid={fieldErrors.title ? true : undefined}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            />
            {fieldErrors.title ? <span className="book-form__error">{fieldErrors.title}</span> : null}
          </label>

          <label className="book-form__field" htmlFor={isbnId}>
            ISBN
            <input
              id={isbnId}
              value={values.isbn}
              maxLength={20}
              disabled={submitting}
              aria-invalid={fieldErrors.isbn ? true : undefined}
              onChange={(event) => setValues((current) => ({ ...current, isbn: event.target.value }))}
            />
            {fieldErrors.isbn ? <span className="book-form__error">{fieldErrors.isbn}</span> : null}
          </label>

          <label className="book-form__field" htmlFor={yearId}>
            Published year
            <input
              id={yearId}
              inputMode="numeric"
              value={values.publishedYear}
              disabled={submitting}
              aria-invalid={fieldErrors.publishedYear ? true : undefined}
              onChange={(event) =>
                setValues((current) => ({ ...current, publishedYear: event.target.value }))
              }
            />
            {fieldErrors.publishedYear ? (
              <span className="book-form__error">{fieldErrors.publishedYear}</span>
            ) : null}
          </label>

          <label className="book-form__field" htmlFor={authorId}>
            Author
            <select
              id={authorId}
              value={values.authorId}
              disabled={submitting || authorsLoading || Boolean(authorsError)}
              aria-invalid={fieldErrors.authorId ? true : undefined}
              onChange={(event) => setValues((current) => ({ ...current, authorId: event.target.value }))}
            >
              <option value="">{authorsLoading ? 'Loading authors…' : 'Select an author'}</option>
              {authors.map((author) =>
                author.id == null ? null : (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ),
              )}
            </select>
            {fieldErrors.authorId ? <span className="book-form__error">{fieldErrors.authorId}</span> : null}
          </label>

          {authorsLoading ? <p className="book-form__hint">Loading authors…</p> : null}
          {authorsError ? (
            <div>
              <p className="book-alert" role="alert">
                {authorsError}
              </p>
              <div className="book-form__actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAuthorReload((value) => value + 1)}
                >
                  Retry authors
                </Button>
              </div>
            </div>
          ) : null}
          {!authorsLoading && !authorsError && authors.length === 0 ? (
            <p className="book-alert" role="alert">
              No authors are available. A book cannot be created or updated until an author exists.
            </p>
          ) : null}

          <div className="book-form__actions">
            <Button type="submit" disabled={!canSubmit}>
              {submitLabel}
            </Button>
            <Button type="button" variant="secondary" disabled={submitting} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
