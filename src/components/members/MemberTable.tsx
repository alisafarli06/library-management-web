import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Trash2 } from 'lucide-react';
import type { MemberDto } from '../../types/api';
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
  onSort: (field: MemberSortField) => void;
  onEdit: (member: MemberDto) => void;
  onDelete: (member: MemberDto) => void;
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

export function MemberTable({
  members,
  sortField,
  sortDirection,
  loading,
  onSort,
  onEdit,
  onDelete,
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && members.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="member-table__skeleton">
                  <td colSpan={3}>Loading members…</td>
                </tr>
              ))
            : members.map((member) => {
                const actionLabel = memberActionLabel(member);
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
                    <td>
                      <div className="member-table__actions">
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
