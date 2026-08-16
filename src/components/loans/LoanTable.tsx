import { Badge } from '../ui/Primitives';
import type { LoanDto } from '../../types/api';
import { formatLoanDate, isActiveLoan, type SortDirection } from './loanListQuery';

interface LoanTableProps {
  loans: LoanDto[];
  sortDirection: SortDirection;
  loading: boolean;
  onSortBorrowedAt: () => void;
  onReturnBook: (loan: LoanDto) => void;
}

export function LoanTable({
  loans,
  sortDirection,
  loading,
  onSortBorrowedAt,
  onReturnBook,
}: LoanTableProps) {
  return (
    <div className="loan-table-wrap">
      <table className="loan-table">
        <thead>
          <tr>
            <th>Book</th>
            <th aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
              <button type="button" className="loan-table__sort is-active" onClick={onSortBorrowedAt}>
                Borrowed
                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
              </button>
            </th>
            <th>Status</th>
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
                return (
                  <tr key={loan.id} className={active ? undefined : 'loan-table__row--quiet'}>
                    <td className="loan-table__title">{loan.bookTitle}</td>
                    <td>{formatLoanDate(loan.borrowedAt)}</td>
                    <td>
                      <Badge tone={active ? 'warning' : 'success'}>{active ? 'Borrowed' : 'Returned'}</Badge>
                    </td>
                    <td>{active || !loan.returnedAt ? '—' : formatLoanDate(loan.returnedAt)}</td>
                    <td>
                      {active ? (
                        <div className="loan-table__actions">
                          <button
                            type="button"
                            className="loan-table__action"
                            onClick={() => onReturnBook(loan)}
                          >
                            Return Book
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
