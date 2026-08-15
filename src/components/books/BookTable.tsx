import type { BookDto } from '../../types/api';
import type { BookSortField, SortDirection } from './bookListQuery';

interface BookTableProps {
  books: BookDto[];
  sortField: BookSortField;
  sortDirection: SortDirection;
  loading: boolean;
  onSort: (field: BookSortField) => void;
  onEdit: (book: BookDto) => void;
}

const COLUMNS: { field: BookSortField; label: string }[] = [
  { field: 'id', label: 'ID' },
  { field: 'title', label: 'Title' },
  { field: 'isbn', label: 'ISBN' },
  { field: 'publishedYear', label: 'Published year' },
];

export function BookTable({ books, sortField, sortDirection, loading, onSort, onEdit }: BookTableProps) {
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && books.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="book-table__skeleton">
                  <td colSpan={6}>Loading books…</td>
                </tr>
              ))
            : books.map((book) => (
                <tr key={book.id ?? `${book.isbn}-${book.title}`}>
                  <td>{book.id ?? '—'}</td>
                  <td>{book.title}</td>
                  <td>{book.isbn}</td>
                  <td>{book.publishedYear ?? '—'}</td>
                  <td>{book.authorId}</td>
                  <td>
                    <button
                      type="button"
                      className="book-table__action"
                      disabled={book.id == null}
                      onClick={() => onEdit(book)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
