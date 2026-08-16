import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Badge } from '../ui/Primitives';
import type { LoanDto } from '../../types/api';
import {
  formatLoanDate,
  getLoanDisplayStatus,
  isActiveLoan,
  loanStatusLabel,
  loanStatusTone,
  type LoanSortField,
  type SortDirection,
} from './loanListQuery';

interface LoanTableProps {
  loans: LoanDto[];
  sortField: LoanSortField;
  sortDirection: SortDirection;
  loading: boolean;
  returningLoanId: number | null;
  onSort: (field: LoanSortField) => void;
  onReturnBook: (loan: LoanDto) => void;
}

function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: LoanSortField;
  activeField: LoanSortField;
  direction: SortDirection;
  onSort: (field: LoanSortField) => void;
}) {
  const active = activeField === field;
  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={active ? 'loan-table__sort is-active' : 'loan-table__sort'}
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        <span
          className={active ? 'loan-table__sort-icon is-active' : 'loan-table__sort-icon is-idle'}
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

export function LoanTable({
  loans,
  sortField,
  sortDirection,
  loading,
  returningLoanId,
  onSort,
  onReturnBook,
}: LoanTableProps) {
  return (
    <div className="loan-table-wrap">
      <table className="loan-table">
        <thead>
          <tr>
            <SortHeader
              label="Book"
              field="book.title"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="Borrowed"
              field="borrowedAt"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="Status"
              field="returnedAt"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />
            <th>Returned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && loans.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="loan-table__skeleton">
                  <td colSpan={5}>Loading loans…</td>
                </tr>
              ))
            : loans.map((loan) => {
                const active = isActiveLoan(loan.returnedAt);
                const status = getLoanDisplayStatus(loan.returnedAt);
                const marking = returningLoanId === loan.id;
                return (
                  <tr key={loan.id} className={active ? undefined : 'loan-table__row--quiet'}>
                    <td className="loan-table__title">{loan.bookTitle}</td>
                    <td>{formatLoanDate(loan.borrowedAt)}</td>
                    <td>
                      <Badge tone={loanStatusTone(status)}>{loanStatusLabel(status)}</Badge>
                    </td>
                    <td>{active || !loan.returnedAt ? '—' : formatLoanDate(loan.returnedAt)}</td>
                    <td>
                      {active ? (
                        <div className="loan-table__actions">
                          <button
                            type="button"
                            className="loan-table__action"
                            disabled={returningLoanId != null}
                            aria-busy={marking || undefined}
                            onClick={() => onReturnBook(loan)}
                          >
                            {marking ? 'Marking…' : 'Mark as Returned'}
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
