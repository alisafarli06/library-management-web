import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createMember, deleteMember, listMembers, updateMember } from '../api/members';
import { getCurrentRole } from '../auth/session';
import { errorMessage } from '../components/auth/formErrors';
import { MemberConfirmDialog } from '../components/members/MemberConfirmDialog';
import { MemberForm, type MemberFormValues } from '../components/members/MemberForm';
import { MemberPagination } from '../components/members/MemberPagination';
import { MemberTable } from '../components/members/MemberTable';
import {
  memberListQueryToSearchParams,
  parseMemberListQuery,
  toMemberApiQuery,
  type MemberListQuery,
} from '../components/members/memberListQuery';
import '../components/members/members.css';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type { MemberDto, Page } from '../types/api';

const EMPTY_MEMBER_FORM: MemberFormValues = { name: '', email: '' };

export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseMemberListQuery(searchParams), [searchParams]);
  const [result, setResult] = useState<Page<MemberDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; memberId?: number; values: MemberFormValues } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberDto | null>(null);
  const canManageMembers = getCurrentRole() === 'ADMIN';

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError(null);
      try {
        const page = await listMembers(toMemberApiQuery(appliedQuery));
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
      setActionError(errorMessage(deleteError, 'Unable to delete the member.'));
    } finally {
      setSubmitting(false);
    }
  }

  const members = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;

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

      {!error && !loading && members.length === 0 ? (
        <EmptyState title="No members found." body="There are no member records to display yet." />
      ) : null}

      {!error && (loading || members.length > 0) ? (
        <Card>
          <MemberTable
            members={members}
            sortDirection={appliedQuery.sortDirection}
            loading={loading}
            onSortName={() =>
              replaceQuery({
                ...appliedQuery,
                page: 0,
                sortDirection: appliedQuery.sortDirection === 'asc' ? 'desc' : 'asc',
              })
            }
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
          title="Delete member"
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
            Delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? This member will be removed and cannot
            be undone from this screen.
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
