import type { AuthorDto } from '../../types/api';
import type { SortDirection } from './authorListQuery';

interface AuthorTableProps {
  authors: AuthorDto[];
  sortDirection: SortDirection;
  loading: boolean;
  canManage: boolean;
  onSortName: () => void;
  onEdit: (author: AuthorDto) => void;
  onDelete: (author: AuthorDto) => void;
}

export function AuthorTable({
  authors,
  sortDirection,
  loading,
  canManage,
  onSortName,
  onEdit,
  onDelete,
}: AuthorTableProps) {
  const columnCount = canManage ? 3 : 2;

  return (
    <div className="book-table-wrap">
      <table className="book-table">
        <thead>
          <tr>
            <th>ID</th>
            <th aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
              <button type="button" className="book-table__sort is-active" onClick={onSortName}>
                Name
                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
              </button>
            </th>
            {canManage ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {loading && authors.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="book-table__skeleton">
                  <td colSpan={columnCount}>Loading authors…</td>
                </tr>
              ))
            : authors.map((author) => (
                <tr key={author.id ?? author.name}>
                  <td>{author.id ?? '—'}</td>
                  <td>{author.name}</td>
                  {canManage ? (
                    <td>
                      <div className="book-table__actions">
                        <button
                          type="button"
                          className="book-table__action"
                          disabled={author.id == null}
                          aria-label={`Edit ${author.name}`}
                          onClick={() => onEdit(author)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="book-table__action"
                          disabled={author.id == null}
                          aria-label={`Delete ${author.name}`}
                          onClick={() => onDelete(author)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
