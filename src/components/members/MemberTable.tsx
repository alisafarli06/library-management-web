import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Trash2 } from 'lucide-react';
import type { MemberDto } from '../../types/api';
import { Badge, Button } from '../ui/Primitives';
import {
  memberActionLabel,
  memberDisplayName,
  memberHasPlaceholderName,
  type MemberSortField,
  type SortDirection,
} from './memberListQuery';

interface MemberTableProps {
  members: MemberDto[];
  sortField: MemberSortField;
  sortDirection: SortDirection;
  loading: boolean;
  canManageAccounts: boolean;
  currentEmail: string | null;
  onSort: (field: MemberSortField) => void;
  onEdit: (member: MemberDto) => void;
  onDelete: (member: MemberDto) => void;
  onMakeAdmin: (member: MemberDto) => void;
  onRemoveAdmin: (member: MemberDto) => void;
  onBlock: (member: MemberDto) => void;
  onUnblock: (member: MemberDto) => void;
}

function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: MemberSortField;
  activeField: MemberSortField;
  direction: SortDirection;
  onSort: (field: MemberSortField) => void;
}) {
  const active = activeField === field;
  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={active ? 'member-table__sort is-active' : 'member-table__sort'}
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        <span
          className={active ? 'member-table__sort-icon is-active' : 'member-table__sort-icon is-idle'}
          aria-hidden="true"
        >
          {active ? (
            direction === 'asc' ? (
              <ArrowUp size={14} strokeWidth={2.5} />
            ) : (
              <ArrowDown size={14} strokeWidth={2.5} />
            )
          ) : (
            <ChevronsUpDown size={14} strokeWidth={1.75} />
          )}
        </span>
      </button>
    </th>
  );
}

function isSelfMember(member: MemberDto, currentEmail: string | null): boolean {
  return currentEmail != null && member.email.toLowerCase() === currentEmail.toLowerCase();
}

function hasLinkedLoginAccount(member: MemberDto): boolean {
  return member.userId != null;
}

export function MemberTable({
  members,
  sortField,
  sortDirection,
  loading,
  canManageAccounts,
  currentEmail,
  onSort,
  onEdit,
  onDelete,
  onMakeAdmin,
  onRemoveAdmin,
  onBlock,
  onUnblock,
}: MemberTableProps) {
  return (
    <div className="member-table-wrap">
      <table className="member-table">
        <thead>
          <tr>
            <SortHeader
              label="Name"
              field="name"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="Email"
              field="email"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            <th>Login role</th>
            <th>Account status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && members.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="member-table__skeleton">
                  <td colSpan={5}>Loading members…</td>
                </tr>
              ))
            : members.map((member) => {
                const actionLabel = memberActionLabel(member);
                const linkedAccount = hasLinkedLoginAccount(member);
                const hideSelfActions = isSelfMember(member, currentEmail);
                return (
                  <tr key={member.id ?? member.email}>
                    <td>
                      {memberHasPlaceholderName(member) ? (
                        <span className="member-table__placeholder">{memberDisplayName(member)}</span>
                      ) : (
                        memberDisplayName(member)
                      )}
                    </td>
                    <td>{member.email}</td>
                    {linkedAccount ? (
                      <>
                        <td>
                          {member.role ? (
                            <Badge tone={member.role === 'ADMIN' ? 'info' : 'neutral'}>{member.role}</Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {member.status ? (
                            <Badge tone={member.status === 'BLOCKED' ? 'danger' : 'success'}>{member.status}</Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                      </>
                    ) : (
                      <td colSpan={2}>
                        <span className="member-table__placeholder">No login account</span>
                      </td>
                    )}
                    <td>
                      <div className="member-table__actions">
                        {canManageAccounts && linkedAccount && member.role != null && member.status != null && !hideSelfActions ? (
                          <>
                            {member.role === 'USER' ? (
                              <Button type="button" variant="secondary" onClick={() => onMakeAdmin(member)}>
                                Make Admin
                              </Button>
                            ) : (
                              <Button type="button" variant="secondary" onClick={() => onRemoveAdmin(member)}>
                                Remove Admin
                              </Button>
                            )}
                            {member.status === 'BLOCKED' ? (
                              <Button type="button" variant="secondary" onClick={() => onUnblock(member)}>
                                Unblock
                              </Button>
                            ) : (
                              <Button type="button" variant="secondary" onClick={() => onBlock(member)}>
                                Block
                              </Button>
                            )}
                          </>
                        ) : null}
                        <button
                          type="button"
                          className="member-table__action"
                          disabled={member.id == null}
                          aria-label={`Edit ${actionLabel}`}
                          onClick={() => onEdit(member)}
                        >
                          <Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="member-table__action member-table__action--danger"
                          disabled={member.id == null}
                          aria-label={`Delete ${actionLabel}`}
                          onClick={() => onDelete(member)}
                        >
                          <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
