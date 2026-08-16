import { useEffect, useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
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

const EMPTY_MEMBERS: MemberDto[] = [];

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

function memberMatches(member: MemberDto, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return member.name.toLowerCase().includes(needle) || member.email.toLowerCase().includes(needle);
}

export function BookBorrowDialog({ book, submitting, onSubmit, onCancel }: BookBorrowDialogProps) {
  const searchId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null);
  const [members, setMembers] = useState<MemberDto[]>(EMPTY_MEMBERS);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const filteredMembers = useMemo(
    () => members.filter((member) => member.id != null && memberMatches(member, query)),
    [members, query],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onDocumentKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape' || submitting) {
        return;
      }
      if (listOpen) {
        event.preventDefault();
        setListOpen(false);
        return;
      }
      onCancel();
    }
    window.addEventListener('keydown', onDocumentKeyDown);
    return () => window.removeEventListener('keydown', onDocumentKeyDown);
  }, [listOpen, onCancel, submitting]);

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
          setMembers(EMPTY_MEMBERS);
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

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, listOpen]);

  function selectMember(member: MemberDto) {
    if (member.id == null) {
      return;
    }
    setSelectedMember(member);
    setQuery('');
    setListOpen(false);
    setFormError(null);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setListOpen(true);
      setHighlightedIndex((current) => Math.min(current + 1, Math.max(filteredMembers.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setListOpen(true);
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' && listOpen) {
      const highlighted = filteredMembers[highlightedIndex];
      if (highlighted) {
        event.preventDefault();
        selectMember(highlighted);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || membersLoading || membersError || selectedMember?.id == null) {
      if (selectedMember?.id == null && !membersError) {
        setFormError('Select a library member.');
      }
      return;
    }

    setFormError(null);
    try {
      await onSubmit(selectedMember.id);
    } catch (error) {
      setFormError(errorMessage(error, 'Unable to borrow the book.'));
    }
  }

  const canSubmit =
    !submitting && !membersLoading && !membersError && members.length > 0 && selectedMember?.id != null;
  const activeOptionId =
    listOpen && filteredMembers[highlightedIndex]?.id != null
      ? `${listId}-option-${filteredMembers[highlightedIndex].id}`
      : undefined;

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
          Borrow <strong>{book.title}</strong> on behalf of a library member. Search by name or email.
        </p>
        <form className="book-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="book-alert" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="member-combobox">
            <label className="book-form__field" htmlFor={searchId}>
              Member
              <input
                id={searchId}
                type="search"
                role="combobox"
                autoComplete="off"
                spellCheck={false}
                placeholder={membersLoading ? 'Loading members…' : 'Search by name or email'}
                value={query}
                disabled={submitting || membersLoading || Boolean(membersError) || members.length === 0}
                aria-expanded={listOpen}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeOptionId}
                onFocus={() => {
                  if (!membersLoading && !membersError && members.length > 0) {
                    setListOpen(true);
                  }
                }}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setListOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
              />
            </label>

            {listOpen && !membersLoading && !membersError && members.length > 0 ? (
              <ul
                id={listId}
                className="member-combobox__list"
                role="listbox"
                aria-label="Matching members"
              >
                {filteredMembers.length === 0 ? (
                  <li className="member-combobox__empty" role="presentation">
                    No members found
                  </li>
                ) : (
                  filteredMembers.map((member, index) =>
                    member.id == null ? null : (
                      <li key={member.id} role="presentation">
                        <button
                          type="button"
                          id={`${listId}-option-${member.id}`}
                          role="option"
                          aria-selected={selectedMember?.id === member.id}
                          className={
                            index === highlightedIndex
                              ? 'member-combobox__option is-active'
                              : 'member-combobox__option'
                          }
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => selectMember(member)}
                        >
                          <span className="member-combobox__name">{member.name}</span>
                          <span className="member-combobox__email">{member.email}</span>
                        </button>
                      </li>
                    ),
                  )
                )}
              </ul>
            ) : null}
          </div>

          {selectedMember ? (
            <p className="member-combobox__selected" data-testid="selected-member">
              Selected: <strong>{selectedMember.name}</strong>
              <span className="member-combobox__email">{selectedMember.email}</span>
            </p>
          ) : (
            <p className="book-form__hint">Select a member to enable Borrow.</p>
          )}

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
