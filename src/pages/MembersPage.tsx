import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createMember, deleteMember, searchMembers, updateMember } from '../api/members';
import { ApiError } from '../api/http';
import { getCurrentRole } from '../auth/session';
import { errorMessage } from '../components/auth/formErrors';
import { MemberConfirmDialog } from '../components/members/MemberConfirmDialog';
import { MemberForm, type MemberFormValues } from '../components/members/MemberForm';
import { MemberPagination } from '../components/members/MemberPagination';
import { MemberTable } from '../components/members/MemberTable';
import {
  memberDisplayName,
  memberHasPlaceholderName,
  memberListQueryToSearchParams,
  memberQueryHasSearch,
  nextMemberSort,
  parseMemberListQuery,
  toMemberApiQuery,
  type MemberListQuery,
} from '../components/members/memberListQuery';
import '../components/members/members.css';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type { MemberDto, Page } from '../types/api';

const EMPTY_MEMBER_FORM: MemberFormValues = { name: '', email: '' };
const SEARCH_DEBOUNCE_MS = 350;

function memberDeleteErrorMessage(error: unknown, member: MemberDto): string {
  const isIntegrityConflict =
    error instanceof ApiError &&
    (error.status === 409 || /data integrity violation/i.test(error.message));

  if (isIntegrityConflict) {
    if ((member.activeLoanCount ?? 0) > 0) {
      return "Can't delete this member — they still have an active loan. Return the book first, then try again.";
    }
    return "Can't delete this member — they still have borrow history linked to their account.";
  }

  return errorMessage(error, 'Unable to delete the member.');
}

export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseMemberListQuery(searchParams), [searchParams]);
  const [result, setResult] = useState<Page<MemberDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchInput, setSearchInput] = useState(appliedQuery.q);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; memberId?: number; values: MemberFormValues } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberDto | null>(null);
  const canManageMembers = getCurrentRole() === 'ADMIN';

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
        memberListQueryToSearchParams({
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

    async function loadMembers() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchMembers(toMemberApiQuery(appliedQuery));
        if (!cancelled) {
          setResult(page);
        }
      } catch (loadError) {
        if (!cancelled) {
          setResult(null);
          setError(errorMessage(loadError, 'Unable to load members.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [appliedQuery, reloadToken]);

  function replaceQuery(next: MemberListQuery) {
    setSearchParams(memberListQueryToSearchParams(next), { replace: true });
  }

  function closeEditor() {
    if (!submitting) {
      setEditor(null);
    }
  }

  async function handleSave(member: MemberDto) {
    if (!canManageMembers || !editor || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      if (editor.mode === 'create') {
        await createMember(member);
        setSuccessMessage('Member created successfully.');
      } else if (editor.memberId != null) {
        await updateMember(editor.memberId, member);
        setSuccessMessage('Member updated successfully.');
      } else {
        throw new Error('Unable to save the member.');
      }
      setEditor(null);
      setReloadToken((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!canManageMembers || !deleteTarget?.id || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await deleteMember(deleteTarget.id);
      setSuccessMessage('Member deleted successfully.');
      setDeleteTarget(null);
      if ((result?.content.length ?? 0) === 1 && appliedQuery.page > 0) {
        replaceQuery({ ...appliedQuery, page: appliedQuery.page - 1 });
      } else {
        setReloadToken((value) => value + 1);
      }
    } catch (deleteError) {
      setActionError(memberDeleteErrorMessage(deleteError, deleteTarget));
    } finally {
      setSubmitting(false);
    }
  }

  const members = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;
  const hasSearch = memberQueryHasSearch(appliedQuery);
  const hasLoadedEmptyCatalogue = !loading && !error && members.length === 0 && !hasSearch && result != null;
  const hasFilteredEmpty = !loading && !error && members.length === 0 && hasSearch;
  const showResultsCard = !error && (loading || members.length > 0 || hasSearch);

  return (
    <div className="member-page">
      <div className="member-page__toolbar">
        <PageHeader title="Members" description="Manage library members. Borrowing stays on the Books page." />
        {canManageMembers ? (
          <Button
            type="button"
            onClick={() => {
              setSuccessMessage(null);
              setActionError(null);
              setEditor({ mode: 'create', values: EMPTY_MEMBER_FORM });
            }}
          >
            Add Member
          </Button>
        ) : null}
      </div>

      {successMessage ? (
        <p className="member-success" role="status">
          {successMessage}
        </p>
      ) : null}

      {error ? (
        <div>
          <p className="member-alert" role="alert">
            {error}
          </p>
          <div className="member-form__actions">
            <Button type="button" variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {hasLoadedEmptyCatalogue ? (
        <EmptyState title="No members found." body="There are no member records to display yet." />
      ) : null}

      {showResultsCard ? (
        <Card>
          <div className="member-toolbar">
            <label className="member-search">
              <span className="member-search__label">
                Search
                {loading ? <span className="member-search__spinner" aria-hidden="true" /> : null}
              </span>
              <input
                type="search"
                value={searchInput}
                placeholder="Search by name or email"
                autoComplete="off"
                aria-busy={loading || undefined}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>
          </div>
          {hasFilteredEmpty ? (
            <EmptyState title="No members match your search." body="Try a different name or email." />
          ) : (
            <div className={loading ? 'member-table-loading' : undefined}>
              <MemberTable
                members={members}
                sortField={appliedQuery.sortField}
                sortDirection={appliedQuery.sortDirection}
                loading={loading}
                onSort={(field) => replaceQuery(nextMemberSort(appliedQuery, field))}
                onEdit={(member) => {
                  if (!canManageMembers || member.id == null) {
                    return;
                  }
                  setSuccessMessage(null);
                  setActionError(null);
                  setEditor({
                    mode: 'edit',
                    memberId: member.id,
                    values: { name: member.name, email: member.email },
                  });
                }}
                onDelete={(member) => {
                  if (!canManageMembers || member.id == null) {
                    return;
                  }
                  setSuccessMessage(null);
                  setActionError(null);
                  setDeleteTarget(member);
                }}
              />
            </div>
          )}
          <MemberPagination
            page={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            disabled={loading}
            onPrevious={() => replaceQuery({ ...appliedQuery, page: Math.max(appliedQuery.page - 1, 0) })}
            onNext={() => replaceQuery({ ...appliedQuery, page: appliedQuery.page + 1 })}
          />
        </Card>
      ) : null}

      {canManageMembers && editor ? (
        <MemberForm
          mode={editor.mode}
          initialValues={editor.values}
          submitting={submitting}
          onSubmit={handleSave}
          onCancel={closeEditor}
        />
      ) : null}

      {canManageMembers && deleteTarget ? (
        <MemberConfirmDialog
          title="Delete member?"
          confirmLabel="Delete member"
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
          <p className="member-form__hint">
            Delete{' '}
            <strong>
              {memberHasPlaceholderName(deleteTarget)
                ? deleteTarget.email
                : memberDisplayName(deleteTarget)}
            </strong>
            {memberHasPlaceholderName(deleteTarget) ? null : ` (${deleteTarget.email})`}?
            {(deleteTarget.activeLoanCount ?? 0) > 0
              ? ` This member has ${deleteTarget.activeLoanCount} active loan${
                  deleteTarget.activeLoanCount === 1 ? '' : 's'
                }.`
              : null}{' '}
            Deletion may fail if this member still has loan history or borrowed books. This cannot be undone from this
            screen.
          </p>
          {actionError ? (
            <p className="member-alert" role="alert">
              {actionError}
            </p>
          ) : null}
        </MemberConfirmDialog>
      ) : null}
    </div>
  );
}
