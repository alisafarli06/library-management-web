import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserLoans, returnOwnBook } from '../api/user';
import { errorMessage } from '../components/auth/formErrors';
import { LoanConfirmDialog } from '../components/loans/LoanConfirmDialog';
import { LoanPagination } from '../components/loans/LoanPagination';
import { LoanTable } from '../components/loans/LoanTable';
import {
  isActiveLoan,
  loanListQueryToSearchParams,
  loanMatchesSearch,
  nextLoanSort,
  parseLoanListQuery,
  toLoanPageApiQuery,
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

export function MyLoansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseLoanListQuery(searchParams), [searchParams]);
  const [result, setResult] = useState<Page<LoanDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loanToReturn, setLoanToReturn] = useState<LoanDto | null>(null);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const returnInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLoans() {
      setLoading(true);
      setError(null);
      try {
        const page = await getUserLoans(toLoanPageApiQuery(appliedQuery));
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

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function replaceQuery(next: LoanListQuery) {
    setSearchParams(loanListQueryToSearchParams(next), { replace: true });
  }

  function closeReturnDialog() {
    if (returnSubmitting) {
      return;
    }
    setLoanToReturn(null);
    setReturnError(null);
  }

  async function confirmReturn() {
    if (!loanToReturn || returnSubmitting || returnInFlight.current) {
      return;
    }
    returnInFlight.current = true;
    setReturnSubmitting(true);
    setReturnError(null);
    try {
      const title = loanToReturn.bookTitle;
      await returnOwnBook(loanToReturn.bookId);
      setLoanToReturn(null);
      setSuccessMessage(`Marked “${title}” as returned.`);
      setReloadToken((value) => value + 1);
    } catch (submitError) {
      setReturnError(errorMessage(submitError, 'Unable to return the book.'));
    } finally {
      returnInFlight.current = false;
      setReturnSubmitting(false);
    }
  }

  const loans = result?.content ?? [];
  const visibleLoans = loans.filter((loan) => {
    if (statusFilter === 'borrowed' && !isActiveLoan(loan.returnedAt)) {
      return false;
    }
    if (statusFilter === 'returned' && isActiveLoan(loan.returnedAt)) {
      return false;
    }
    return loanMatchesSearch(loan, searchQuery);
  });
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;
  const hasLoadedEmptyHistory = !error && !loading && Boolean(result) && loans.length === 0;
  const hasFilteredEmpty = !error && !loading && loans.length > 0 && visibleLoans.length === 0;
  const returningLoanId = returnSubmitting && loanToReturn ? loanToReturn.id : null;

  return (
    <div className="loan-page">
      <div className="loan-page__toolbar">
        <PageHeader
          title="My Loans"
          description="View the books you've borrowed and their return status."
        />
      </div>

      {successMessage ? (
        <p className="loan-toast" role="status">
          {successMessage}
          <button type="button" className="loan-toast__dismiss" aria-label="Dismiss" onClick={() => setSuccessMessage(null)}>
            ×
          </button>
        </p>
      ) : null}

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
        <EmptyState title="No borrowing history yet." body="Books you borrow will appear here." />
      ) : null}

      {!error && (loading || loans.length > 0) ? (
        <Card>
          <div className="loan-toolbar">
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
            <label className="loan-search">
              <span className="loan-search__label">Search</span>
              <input
                type="search"
                value={searchQuery}
                placeholder="Search by book title"
                autoComplete="off"
                disabled={loading}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>
          <p className="loan-filters__hint">Filters and search apply to the loans on this page only.</p>
          {hasFilteredEmpty ? (
            <EmptyState
              title="No loans on this page match your filters."
              body="Change the status filter or search, or go to another page. This does not search your full history."
            />
          ) : (
            <LoanTable
              loans={visibleLoans}
              sortField={appliedQuery.sortField}
              sortDirection={appliedQuery.sortDirection}
              loading={loading}
              returningLoanId={returningLoanId}
              onSort={(field) => replaceQuery(nextLoanSort(appliedQuery, field))}
              onReturnBook={(loan) => {
                setSuccessMessage(null);
                setReturnError(null);
                setLoanToReturn(loan);
              }}
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

      {loanToReturn ? (
        <LoanConfirmDialog
          title="Mark as returned?"
          confirmLabel="Mark as Returned"
          submittingLabel="Marking…"
          submitting={returnSubmitting}
          onConfirm={() => {
            void confirmReturn();
          }}
          onCancel={closeReturnDialog}
        >
          <p className="loan-dialog__message">
            Are you sure you want to return &quot;{loanToReturn.bookTitle}&quot;?
          </p>
          {returnError ? (
            <p className="loan-alert" role="alert">
              {returnError}
            </p>
          ) : null}
        </LoanConfirmDialog>
      ) : null}
    </div>
  );
}
