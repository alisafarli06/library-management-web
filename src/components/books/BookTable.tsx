import { Badge } from '../ui/Primitives';
import type { BookDto } from '../../types/api';
import type { BookSortField, SortDirection } from './bookListQuery';

interface BookTableProps {
  books: BookDto[];
  sortField: BookSortField;
  sortDirection: SortDirection;
  loading: boolean;
  canManage: boolean;
  onSort: (field: BookSortField) => void;
  onEdit: (book: BookDto) => void;
  onDelete: (book: BookDto) => void;
  onBorrow: (book: BookDto) => void;
}

const COLUMNS: { field: BookSortField; label: string }[] = [
  { field: 'id', label: 'ID' },
  { field: 'title', label: 'Title' },
  { field: 'isbn', label: 'ISBN' },
  { field: 'publishedYear', label: 'Published year' },
];

function isAvailable(book: BookDto): boolean {
  return book.available === true;
}

export function BookTable({
  books,
  sortField,
  sortDirection,
  loading,
  canManage,
  onSort,
  onEdit,
  onDelete,
  onBorrow,
}: BookTableProps) {
  return (
    <div className="book-table-wrap">
      <table className="book-table">
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sortField === column.field;
              return (
                <th key={column.field} aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    className={active ? 'book-table__sort is-active' : 'book-table__sort'}
                    onClick={() => onSort(column.field)}
                  >
                    {column.label}
                    {active ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              );
            })}
            <th>Author ID</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && books.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="book-table__skeleton">
                  <td colSpan={7}>Loading books…</td>
                </tr>
              ))
            : books.map((book) => {
                const available = isAvailable(book);
                return (
                  <tr key={book.id ?? `${book.isbn}-${book.title}`}>
                    <td>{book.id ?? '—'}</td>
                    <td>{book.title}</td>
                    <td>{book.isbn}</td>
                    <td>{book.publishedYear ?? '—'}</td>
                    <td>{book.authorId}</td>
                    <td>
                      <Badge>{available ? 'Available' : 'Currently borrowed'}</Badge>
                    </td>
                    <td>
                      <div className="book-table__actions">
                        <button
                          type="button"
                          className="book-table__action"
                          disabled={book.id == null || !available}
                          onClick={() => {
                            if (available) {
                              onBorrow(book);
                            }
                          }}
                        >
                          {available ? 'Borrow' : 'Borrowed'}
                        </button>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              className="book-table__action"
                              disabled={book.id == null}
                              onClick={() => onEdit(book)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="book-table__action"
                              disabled={book.id == null}
                              onClick={() => onDelete(book)}
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
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
