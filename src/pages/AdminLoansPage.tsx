import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLoans } from '../api/admin';
import { errorMessage } from '../components/auth/formErrors';
import { AdminLoanTable } from '../components/loans/AdminLoanTable';
import { LoanPagination } from '../components/loans/LoanPagination';
import {
  isActiveLoan,
  loanListQueryToSearchParams,
  parseLoanListQuery,
  toLoanApiQuery,
  type LoanListQuery,
  type LoanStatusFilter,
} from '../components/loans/loanListQuery';
import '../components/loans/loans.css';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type { LoanDto, Page } from '../types/api';

const STATUS_OPTIONS: { id: LoanStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'borrowed', label: 'Currently Borrowed' },
  { id: 'returned', label: 'Returned' },
];

export function AdminLoansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseLoanListQuery(searchParams), [searchParams]);
  const [result, setResult] = useState<Page<LoanDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>('all');

  useEffect(() => {
    let cancelled = false;

    async function loadLoans() {
      setLoading(true);
      setError(null);
      try {
        const page = await getLoans(toLoanApiQuery(appliedQuery));
        if (!cancelled) {
          setResult(page);
        }
      } catch (loadError) {
        if (!cancelled) {
          setResult(null);
          setError(errorMessage(loadError, 'Unable to load loans.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLoans();
    return () => {
      cancelled = true;
    };
  }, [appliedQuery, reloadToken]);

  function replaceQuery(next: LoanListQuery) {
    setSearchParams(loanListQueryToSearchParams(next), { replace: true });
  }

  const loans = result?.content ?? [];
  const visibleLoans =
    statusFilter === 'all'
      ? loans
      : loans.filter((loan) =>
          statusFilter === 'borrowed' ? isActiveLoan(loan.returnedAt) : !isActiveLoan(loan.returnedAt),
        );
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;
  const hasLoadedEmptyHistory = !error && !loading && Boolean(result) && loans.length === 0;
  const hasFilteredEmpty = !error && !loading && loans.length > 0 && visibleLoans.length === 0;

  return (
    <div className="loan-page">
      <div className="loan-page__toolbar">
        <PageHeader
          title="Loan Management"
          description="Monitor borrowing activity and manage the library's loan history."
        />
      </div>

      {error ? (
        <div>
          <p className="loan-alert" role="alert">
            {error}
          </p>
          <div className="loan-form__actions">
            <Button type="button" variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {hasLoadedEmptyHistory ? (
        <EmptyState title="No loan history yet." body="Borrowing activity will appear here." />
      ) : null}

      {!error && (loading || loans.length > 0) ? (
        <Card>
          <div className="loan-filters" role="group" aria-label="Filter loans on this page">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={statusFilter === option.id ? 'loan-filter is-active' : 'loan-filter'}
                aria-pressed={statusFilter === option.id}
                onClick={() => setStatusFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="loan-filters__hint">Status filters apply to the loans on this page only.</p>
          {hasFilteredEmpty ? (
            <EmptyState
              title="No loans on this page match the selected status."
              body="Change the filter or go to another page. This does not search your full history."
            />
          ) : (
            <AdminLoanTable
              loans={visibleLoans}
              sortDirection={appliedQuery.sortDirection}
              loading={loading}
              onSortBorrowedAt={() =>
                replaceQuery({
                  ...appliedQuery,
                  page: 0,
                  sortDirection: appliedQuery.sortDirection === 'desc' ? 'asc' : 'desc',
                })
              }
            />
          )}
          <LoanPagination
            page={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            disabled={loading}
            onPrevious={() => replaceQuery({ ...appliedQuery, page: Math.max(appliedQuery.page - 1, 0) })}
            onNext={() => replaceQuery({ ...appliedQuery, page: appliedQuery.page + 1 })}
          />
        </Card>
      ) : null}
    </div>
  );
}
