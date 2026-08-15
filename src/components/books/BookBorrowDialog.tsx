import { useEffect, useId, useState, type FormEvent } from 'react';
import { listMembers } from '../../api/members';
import { errorMessage } from '../auth/formErrors';
import { Button } from '../ui/Primitives';
import type { BookDto, MemberDto } from '../../types/api';

interface BookBorrowDialogProps {
  book: BookDto;
  submitting: boolean;
  onSubmit: (memberId: number) => Promise<void>;
  onCancel: () => void;
}

async function loadAllMembers(): Promise<MemberDto[]> {
  const pageSize = 50;
  const first = await listMembers({ page: 0, size: pageSize, sort: 'name,asc' });
  const members = [...first.content];
  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await listMembers({ page, size: pageSize, sort: 'name,asc' });
    members.push(...next.content);
  }
  return members;
}

export function BookBorrowDialog({ book, submitting, onSubmit, onCancel }: BookBorrowDialogProps) {
  const memberFieldId = useId();
  const [memberId, setMemberId] = useState('');
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
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

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setMembersLoading(true);
      setMembersError(null);
      try {
        const loaded = await loadAllMembers();
        if (!cancelled) {
          setMembers(loaded.filter((member) => member.id != null));
        }
      } catch (error) {
        if (!cancelled) {
          setMembers([]);
          setMembersError(errorMessage(error, 'Unable to load members.'));
        }
      } finally {
        if (!cancelled) {
          setMembersLoading(false);
        }
      }
    }

    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || membersLoading || membersError || !memberId) {
      if (!memberId && !membersError) {
        setFormError('Select a library member.');
      }
      return;
    }

    setFormError(null);
    try {
      await onSubmit(Number(memberId));
    } catch (error) {
      setFormError(errorMessage(error, 'Unable to borrow the book.'));
    }
  }

  const canSubmit = !submitting && !membersLoading && !membersError && members.length > 0 && Boolean(memberId);

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
      <div className="book-dialog" role="dialog" aria-modal="true" aria-labelledby="borrow-heading">
        <h2 id="borrow-heading">Borrow book</h2>
        <p className="book-form__hint">
          Borrow <strong>{book.title}</strong> on behalf of a library member. Choose the member by
          name or email.
        </p>
        <form className="book-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="book-alert" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="book-form__field" htmlFor={memberFieldId}>
            Member
            <select
              id={memberFieldId}
              value={memberId}
              disabled={submitting || membersLoading || Boolean(membersError) || members.length === 0}
              onChange={(event) => setMemberId(event.target.value)}
            >
              <option value="">{membersLoading ? 'Loading members…' : 'Select a member'}</option>
              {members.map((member) =>
                member.id == null ? null : (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ),
              )}
            </select>
          </label>

          {membersLoading ? <p className="book-form__hint">Loading members…</p> : null}
          {membersError ? (
            <div>
              <p className="book-alert" role="alert">
                {membersError}
              </p>
              <div className="book-form__actions">
                <Button type="button" variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
                  Retry members
                </Button>
              </div>
            </div>
          ) : null}
          {!membersLoading && !membersError && members.length === 0 ? (
            <p className="book-alert" role="alert">
              No members are available, so this book cannot be borrowed yet.
            </p>
          ) : null}

          <div className="book-form__actions">
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? 'Borrowing…' : 'Borrow'}
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
