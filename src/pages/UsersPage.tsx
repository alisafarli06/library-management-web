import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { deleteUser, searchUsers, updateUserRole } from '../api/users';
import { getCurrentEmail, getCurrentRole } from '../auth/session';
import { errorMessage } from '../components/auth/formErrors';
import { MemberConfirmDialog } from '../components/members/MemberConfirmDialog';
import { MemberPagination } from '../components/members/MemberPagination';
import '../components/members/members.css';
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type { AdminUserDto, Page, Role } from '../types/api';

const SEARCH_DEBOUNCE_MS = 350;

interface UsersQuery {
  page: number;
  q: string;
}

function parseUsersQuery(params: URLSearchParams): UsersQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    q: (params.get('q') ?? '').trim(),
  };
}

function toSearchParams(query: UsersQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 0) {
    params.set('page', String(query.page));
  }
  if (query.q) {
    params.set('q', query.q);
  }
  return params;
}

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseUsersQuery(searchParams), [searchParams]);
  const [result, setResult] = useState<Page<AdminUserDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchInput, setSearchInput] = useState(appliedQuery.q);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: AdminUserDto; nextRole: Role } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserDto | null>(null);
  const canManageUsers = getCurrentRole() === 'ADMIN';
  const currentEmail = getCurrentEmail();

  useEffect(() => {
    setSearchInput(appliedQuery.q);
  }, [appliedQuery.q]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === appliedQuery.q) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSearchParams(toSearchParams({ ...appliedQuery, page: 0, q: trimmed }), { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchInput, appliedQuery, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchUsers({
          page: appliedQuery.page,
          size: 20,
          sort: 'fullName,asc',
          ...(appliedQuery.q ? { q: appliedQuery.q } : {}),
        });
        if (!cancelled) {
          setResult(page);
        }
      } catch (loadError) {
        if (!cancelled) {
          setResult(null);
          setError(errorMessage(loadError, 'Unable to load users.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [appliedQuery, reloadToken]);

  function replaceQuery(next: UsersQuery) {
    setSearchParams(toSearchParams(next), { replace: true });
  }

  async function handleRoleChange() {
    if (!canManageUsers || !roleTarget || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await updateUserRole(roleTarget.user.id, roleTarget.nextRole);
      setSuccessMessage(
        roleTarget.nextRole === 'ADMIN'
          ? `${roleTarget.user.fullName} is now an ADMIN.`
          : `ADMIN role removed from ${roleTarget.user.fullName}.`,
      );
      setRoleTarget(null);
      setReloadToken((value) => value + 1);
    } catch (roleError) {
      setActionError(errorMessage(roleError, 'Unable to change the user role.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!canManageUsers || !deleteTarget || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await deleteUser(deleteTarget.id);
      setSuccessMessage(`${deleteTarget.fullName} was deleted.`);
      setDeleteTarget(null);
      if ((result?.content.length ?? 0) === 1 && appliedQuery.page > 0) {
        replaceQuery({ ...appliedQuery, page: appliedQuery.page - 1 });
      } else {
        setReloadToken((value) => value + 1);
      }
    } catch (deleteError) {
      setActionError(errorMessage(deleteError, 'Unable to delete the user.'));
    } finally {
      setSubmitting(false);
    }
  }

  const users = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;
  const hasSearch = appliedQuery.q.length > 0;
  const hasLoadedEmpty = !loading && !error && users.length === 0 && !hasSearch && result != null;
  const hasFilteredEmpty = !loading && !error && users.length === 0 && hasSearch;
  const showResultsCard = !error && (loading || users.length > 0 || hasSearch);

  return (
    <div className="member-page">
      <div className="member-page__toolbar">
        <PageHeader
          title="Users"
          description="Manage account roles. Only ADMIN users can change roles or delete accounts."
        />
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

      {hasLoadedEmpty ? <EmptyState title="No users found." body="There are no user accounts to display yet." /> : null}

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
            <EmptyState title="No users match your search." body="Try a different name or email." />
          ) : (
            <div className={loading ? 'member-table-loading' : undefined}>
              <div className="member-table-wrap">
                <table className="member-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && users.length === 0
                      ? Array.from({ length: 5 }, (_, index) => (
                          <tr key={`skeleton-${index}`} className="member-table__skeleton">
                            <td colSpan={4}>Loading users…</td>
                          </tr>
                        ))
                      : users.map((user) => {
                          const isSelf = currentEmail != null && user.email.toLowerCase() === currentEmail.toLowerCase();
                          const nextRole: Role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
                          return (
                            <tr key={user.id}>
                              <td>{user.fullName}</td>
                              <td>{user.email}</td>
                              <td>
                                <Badge tone={user.role === 'ADMIN' ? 'info' : 'neutral'}>{user.role}</Badge>
                              </td>
                              <td>
                                {canManageUsers ? (
                                  <div className="member-table__actions">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={() => {
                                        setSuccessMessage(null);
                                        setActionError(null);
                                        setRoleTarget({ user, nextRole });
                                      }}
                                    >
                                      {user.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="danger"
                                      disabled={isSelf}
                                      onClick={() => {
                                        setSuccessMessage(null);
                                        setActionError(null);
                                        setDeleteTarget(user);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <MemberPagination
            page={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            disabled={loading}
            itemLabel="users"
            onPrevious={() => replaceQuery({ ...appliedQuery, page: Math.max(appliedQuery.page - 1, 0) })}
            onNext={() => replaceQuery({ ...appliedQuery, page: appliedQuery.page + 1 })}
          />
        </Card>
      ) : null}

      {roleTarget ? (
        <MemberConfirmDialog
          title={roleTarget.nextRole === 'ADMIN' ? 'Grant ADMIN role?' : 'Remove ADMIN role?'}
          confirmLabel={roleTarget.nextRole === 'ADMIN' ? 'Make admin' : 'Remove admin'}
          submitting={submitting}
          onConfirm={() => {
            void handleRoleChange();
          }}
          onCancel={() => {
            if (!submitting) {
              setRoleTarget(null);
              setActionError(null);
            }
          }}
        >
          <p className="member-form__hint">
            Change <strong>{roleTarget.user.fullName}</strong> ({roleTarget.user.email}) from{' '}
            <strong>{roleTarget.user.role}</strong> to <strong>{roleTarget.nextRole}</strong>? The change takes effect
            on their next login or token refresh.
          </p>
          {actionError ? (
            <p className="member-alert" role="alert">
              {actionError}
            </p>
          ) : null}
        </MemberConfirmDialog>
      ) : null}

      {deleteTarget ? (
        <MemberConfirmDialog
          title="Delete user?"
          confirmLabel="Delete user"
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
            Delete <strong>{deleteTarget.fullName}</strong> ({deleteTarget.email})? This cannot be undone. Accounts with
            borrow history cannot be deleted.
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
