import { Badge } from '../ui/Primitives';
import type { LoanDto } from '../../types/api';
import { formatLoanDate, isActiveLoan, type SortDirection } from './loanListQuery';

interface AdminLoanTableProps {
  loans: LoanDto[];
  sortDirection: SortDirection;
  loading: boolean;
  onSortBorrowedAt: () => void;
}

export function AdminLoanTable({ loans, sortDirection, loading, onSortBorrowedAt }: AdminLoanTableProps) {
  return (
    <div className="loan-table-wrap">
      <table className="loan-table">
        <thead>
          <tr>
            <th>Book</th>
            <th>Member</th>
            <th aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
              <button type="button" className="loan-table__sort is-active" onClick={onSortBorrowedAt}>
                Borrowed
                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
              </button>
            </th>
            <th>Status</th>
            <th>Returned</th>
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
                  <tr key={loan.id}>
                    <td>{loan.bookTitle}</td>
                    <td>{loan.memberName}</td>
                    <td>{formatLoanDate(loan.borrowedAt)}</td>
                    <td>
                      <Badge>{active ? 'Borrowed' : 'Returned'}</Badge>
                    </td>
                    <td>{active || !loan.returnedAt ? '—' : formatLoanDate(loan.returnedAt)}</td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
