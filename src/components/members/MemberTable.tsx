import type { MemberDto } from '../../types/api';
import type { SortDirection } from './memberListQuery';

interface MemberTableProps {
  members: MemberDto[];
  sortDirection: SortDirection;
  loading: boolean;
  onSortName: () => void;
  onEdit: (member: MemberDto) => void;
  onDelete: (member: MemberDto) => void;
}

export function MemberTable({
  members,
  sortDirection,
  loading,
  onSortName,
  onEdit,
  onDelete,
}: MemberTableProps) {
  return (
    <div className="member-table-wrap">
      <table className="member-table">
        <thead>
          <tr>
            <th aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
              <button type="button" className="member-table__sort is-active" onClick={onSortName}>
                Name
                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
              </button>
            </th>
            <th>Email</th>
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
            : members.map((member) => (
                <tr key={member.id ?? member.email}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>
                    <div className="member-table__actions">
                      <button
                        type="button"
                        className="member-table__action"
                        disabled={member.id == null}
                        aria-label={`Edit ${member.name}`}
                        onClick={() => onEdit(member)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="member-table__action"
                        disabled={member.id == null}
                        aria-label={`Delete ${member.name}`}
                        onClick={() => onDelete(member)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
