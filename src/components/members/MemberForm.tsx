import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { errorMessage, fieldErrorsFrom, isValidEmail } from '../auth/formErrors';
import { Button } from '../ui/Primitives';
import type { MemberDto } from '../../types/api';

export interface MemberFormValues {
  name: string;
  email: string;
}

interface MemberFormProps {
  mode: 'create' | 'edit';
  initialValues: MemberFormValues;
  submitting: boolean;
  onSubmit: (member: MemberDto) => Promise<void>;
  onCancel: () => void;
}

function validate(values: MemberFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  const email = values.email.trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 255) {
    errors.name = 'Name must be at most 255 characters.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (email.length > 255) {
    errors.email = 'Email must be at most 255 characters.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

export function MemberForm({ mode, initialValues, submitting, onSubmit, onCancel }: MemberFormProps) {
  const headingId = useId();
  const nameId = useId();
  const emailId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<MemberFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
      });
    } catch (error) {
      const backendFields = fieldErrorsFrom(error);
      const mapped: Record<string, string> = {};
      const unmapped: string[] = [];
      for (const [key, message] of Object.entries(backendFields)) {
        if (key === 'name' || key === 'email') {
          mapped[key] = message;
        } else {
          unmapped.push(`${key}: ${message}`);
        }
      }
      setFieldErrors(mapped);
      if (unmapped.length > 0) {
        setFormError(unmapped.join(' '));
      } else if (Object.keys(mapped).length === 0) {
        setFormError(errorMessage(error, 'Unable to save the member.'));
      } else {
        setFormError(null);
      }
    }
  }

  const heading = mode === 'create' ? 'Add member' : 'Edit member';
  const submitLabel = submitting
    ? mode === 'create'
      ? 'Creating…'
      : 'Saving…'
    : mode === 'create'
      ? 'Create member'
      : 'Save changes';

  return (
    <div className="member-dialog-root">
      <button
        type="button"
        className="member-dialog__backdrop"
        aria-label="Close dialog"
        disabled={submitting}
        onClick={() => {
          if (!submitting) {
            onCancel();
          }
        }}
      />
      <div className="member-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <h2 id={headingId}>{heading}</h2>
        <form className="member-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="member-alert" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="member-form__field" htmlFor={nameId}>
            Name
            <input
              ref={nameRef}
              id={nameId}
              value={values.name}
              maxLength={255}
              disabled={submitting}
              aria-invalid={fieldErrors.name ? true : undefined}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            />
            {fieldErrors.name ? <span className="member-form__error">{fieldErrors.name}</span> : null}
          </label>

          <label className="member-form__field" htmlFor={emailId}>
            Email
            <input
              id={emailId}
              type="email"
              value={values.email}
              maxLength={255}
              disabled={submitting}
              aria-invalid={fieldErrors.email ? true : undefined}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            />
            {fieldErrors.email ? <span className="member-form__error">{fieldErrors.email}</span> : null}
          </label>

          <div className="member-form__actions">
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
