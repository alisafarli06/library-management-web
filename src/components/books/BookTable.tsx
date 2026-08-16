import { BookOpen, Eye, Pencil, Trash2 } from 'lucide-react';
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
  onDetails: (book: BookDto) => void;
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

function materialsLabel(book: BookDto): string {
  const cover = book.coverFileId != null;
  const preface = book.prefaceFileId != null;
  if (cover && preface) {
    return 'Cover · Preface';
  }
  if (cover) {
    return 'Cover';
  }
  if (preface) {
    return 'Preface';
  }
  return '—';
}

export function BookTable({
  books,
  sortField,
  sortDirection,
  loading,
  canManage,
  onSort,
  onDetails,
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
            <th>Materials</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && books.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="book-table__skeleton">
                  <td colSpan={8}>Loading books…</td>
                </tr>
              ))
            : books.map((book) => {
                const available = isAvailable(book);
                return (
                  <tr key={book.id ?? `${book.isbn}-${book.title}`}>
                    <td>{book.id ?? '—'}</td>
                    <td className="book-table__title">{book.title}</td>
                    <td className="book-table__meta">{book.isbn}</td>
                    <td className="book-table__meta">{book.publishedYear ?? '—'}</td>
                    <td className="book-table__meta">{book.authorId}</td>
                    <td>
                      <Badge tone={available ? 'success' : 'warning'}>
                        {available ? 'Available' : 'Currently borrowed'}
                      </Badge>
                    </td>
                    <td className="book-table__meta">{materialsLabel(book)}</td>
                    <td>
                      <div className="book-table__actions">
                        <button
                          type="button"
                          className="book-table__action"
                          disabled={book.id == null}
                          aria-label="Details"
                          title="Details"
                          onClick={() => onDetails(book)}
                        >
                          <Eye size={15} strokeWidth={1.75} aria-hidden="true" />
                          <span>Details</span>
                        </button>
                        <button
                          type="button"
                          className="book-table__action"
                          disabled={book.id == null || !available}
                          aria-label={available ? 'Borrow' : 'Borrowed'}
                          title={available ? 'Borrow' : 'Borrowed'}
                          onClick={() => {
                            if (available) {
                              onBorrow(book);
                            }
                          }}
                        >
                          <BookOpen size={15} strokeWidth={1.75} aria-hidden="true" />
                          <span>{available ? 'Borrow' : 'Borrowed'}</span>
                        </button>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              className="book-table__action"
                              disabled={book.id == null}
                              aria-label="Edit"
                              title="Edit"
                              onClick={() => onEdit(book)}
                            >
                              <Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="book-table__action book-table__action--danger"
                              disabled={book.id == null}
                              aria-label="Delete"
                              title="Delete"
                              onClick={() => onDelete(book)}
                            >
                              <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                              <span>Delete</span>
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
