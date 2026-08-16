import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { errorMessage, fieldErrorsFrom } from '../auth/formErrors';
import { Button } from '../ui/Primitives';
import type { AuthorDto } from '../../types/api';

interface AuthorFormProps {
  mode: 'create' | 'edit';
  initialName: string;
  submitting: boolean;
  onSubmit: (author: AuthorDto) => Promise<void>;
  onCancel: () => void;
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Name is required';
  }
  if (trimmed.length > 255) {
    return 'Name must be at most 255 characters.';
  }
  return null;
}

export function AuthorForm({ mode, initialName, submitting, onSubmit, onCancel }: AuthorFormProps) {
  const headingId = useId();
  const nameId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
    if (submitting) {
      return;
    }

    const validationError = validateName(name);
    if (validationError) {
      setNameError(validationError);
      setFormError(null);
      return;
    }

    setNameError(null);
    setFormError(null);

    try {
      await onSubmit({ name: name.trim() });
    } catch (error) {
      const backendFields = fieldErrorsFrom(error);
      if (backendFields.name) {
        setNameError(backendFields.name);
      }
      const unmapped = Object.entries(backendFields)
        .filter(([key]) => key !== 'name')
        .map(([key, message]) => `${key}: ${message}`);
      if (unmapped.length > 0) {
        setFormError(unmapped.join(' '));
      } else if (!backendFields.name) {
        setFormError(errorMessage(error, 'Unable to save the author.'));
      } else {
        setFormError(null);
      }
    }
  }

  const heading = mode === 'create' ? 'Add author' : 'Edit author';
  const submitLabel = submitting
    ? mode === 'create'
      ? 'Creating…'
      : 'Saving…'
    : mode === 'create'
      ? 'Create author'
      : 'Save changes';

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
      <div className="book-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <h2 id={headingId}>{heading}</h2>
        <form className="book-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="book-alert" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="book-form__field" htmlFor={nameId}>
            Name
            <input
              ref={nameRef}
              id={nameId}
              value={name}
              maxLength={255}
              disabled={submitting}
              aria-invalid={nameError ? true : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {nameError ? <span className="book-form__error">{nameError}</span> : null}
          </label>

          <div className="book-form__actions">
            <Button type="submit" disabled={submitting}>
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
