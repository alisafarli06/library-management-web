import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, Pencil, Trash2 } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { AuthorDto } from '../../types/api';
import type { AuthorSortField, SortDirection } from './authorListQuery';

interface AuthorTableProps {
  authors: AuthorDto[];
  sortField: AuthorSortField;
  sortDirection: SortDirection;
  loading: boolean;
  canManage: boolean;
  onSort: (field: AuthorSortField) => void;
  onViewBooks: (author: AuthorDto) => void;
  onEdit: (author: AuthorDto) => void;
  onDelete: (author: AuthorDto) => void;
}

function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: AuthorSortField;
  activeField: AuthorSortField;
  direction: SortDirection;
  onSort: (field: AuthorSortField) => void;
}) {
  const active = activeField === field;
  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={active ? 'book-table__sort is-active' : 'book-table__sort'}
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        <span
          className={active ? 'book-table__sort-icon is-active' : 'book-table__sort-icon is-idle'}
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

function stopRowNavigation(event: MouseEvent | KeyboardEvent) {
  event.stopPropagation();
}

export function AuthorTable({
  authors,
  sortField,
  sortDirection,
  loading,
  canManage,
  onSort,
  onViewBooks,
  onEdit,
  onDelete,
}: AuthorTableProps) {
  const columnCount = canManage ? 5 : 4;

  return (
    <div className="book-table-wrap">
      <table className="book-table author-table">
        <thead>
          <tr>
            <SortHeader
              label="ID"
              field="id"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="Name"
              field="name"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="Books"
              field="bookCount"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            {canManage ? <th>Actions</th> : null}
            <th className="author-table__chevron-col">
              <span className="visually-hidden">View books</span>
            </th>
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
                <tr
                  key={author.id ?? author.name}
                  className="author-table__row author-table__row--clickable"
                  tabIndex={0}
                  aria-label={`View books by ${author.name}`}
                  onClick={() => onViewBooks(author)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onViewBooks(author);
                    }
                  }}
                >
                  <td>{author.id ?? '—'}</td>
                  <td>{author.name}</td>
                  <td>{author.bookCount ?? 0}</td>
                  {canManage ? (
                    <td>
                      <div className="book-table__actions" onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
                        <button
                          type="button"
                          className="book-table__action"
                          disabled={author.id == null}
                          aria-label={`Edit ${author.name}`}
                          onClick={() => onEdit(author)}
                        >
                          <Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="book-table__action book-table__action--danger"
                          disabled={author.id == null}
                          aria-label={`Delete ${author.name}`}
                          onClick={() => onDelete(author)}
                        >
                          <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                  <td className="author-table__chevron" aria-hidden="true">
                    <ChevronRight size={16} strokeWidth={2} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
