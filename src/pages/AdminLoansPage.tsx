import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchLoans } from '../api/admin';
import { returnBook } from '../api/members';
import { errorMessage } from '../components/auth/formErrors';
import { AdminLoanTable } from '../components/loans/AdminLoanTable';
import { LoanConfirmDialog } from '../components/loans/LoanConfirmDialog';
import { LoanPagination } from '../components/loans/LoanPagination';
import {
  formatLoanMember,
  loanListQueryToSearchParams,
  loanQueryHasFilters,
  nextLoanSort,
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

const SEARCH_DEBOUNCE_MS = 350;

export function AdminLoansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = useMemo(() => parseLoanListQuery(searchParams), [searchParams]);
  const [result, setResult] = useState<Page<LoanDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchInput, setSearchInput] = useState(appliedQuery.q);
  const [loanToReturn, setLoanToReturn] = useState<LoanDto | null>(null);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const returnInFlight = useRef(false);

  useEffect(() => {
    setSearchInput(appliedQuery.q);
  }, [appliedQuery.q]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === appliedQuery.q) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSearchParams(
        loanListQueryToSearchParams({
          ...appliedQuery,
          page: 0,
          q: trimmed,
        }),
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchInput, appliedQuery, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadLoans() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchLoans(toLoanApiQuery(appliedQuery));
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
      const returnedTitle = loanToReturn.bookTitle;
      const returnedMember = formatLoanMember(loanToReturn);
      await returnBook(loanToReturn.memberId, loanToReturn.bookId);
      setLoanToReturn(null);
      setSuccessMessage(`Marked “${returnedTitle}” as returned for ${returnedMember}.`);
      setReloadToken((value) => value + 1);
    } catch (submitError) {
      setReturnError(errorMessage(submitError, 'Unable to mark the loan as returned.'));
    } finally {
      returnInFlight.current = false;
      setReturnSubmitting(false);
    }
  }

  const loans = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.number ?? appliedQuery.page;
  const hasFilters = loanQueryHasFilters(appliedQuery);
  const hasLoadedEmptyHistory = !error && !loading && Boolean(result) && loans.length === 0 && !hasFilters;
  const hasFilteredEmpty = !error && !loading && Boolean(result) && loans.length === 0 && hasFilters;
  const returningLoanId = returnSubmitting && loanToReturn ? loanToReturn.id : null;
  const showResultsCard = !error && (loading || loans.length > 0 || hasFilters);

  return (
    <div className="loan-page">
      <div className="loan-page__toolbar">
        <PageHeader
          title="Loan Management"
          description="Monitor borrowing activity and manage the library's loan history."
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
        <EmptyState title="No loan history yet." body="Borrowing activity will appear here." />
      ) : null}

      {showResultsCard ? (
        <Card>
          <div className="loan-toolbar">
            <div className="loan-filters" role="group" aria-label="Filter loans by status">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={appliedQuery.status === option.id ? 'loan-filter is-active' : 'loan-filter'}
                  aria-pressed={appliedQuery.status === option.id}
                  onClick={() =>
                    replaceQuery({
                      ...appliedQuery,
                      page: 0,
                      status: option.id,
                    })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="loan-search">
              <span className="loan-search__label">
                Search
                {loading ? <span className="loan-search__spinner" aria-hidden="true" /> : null}
              </span>
              <input
                type="search"
                value={searchInput}
                placeholder="Search by member or book title"
                autoComplete="off"
                aria-busy={loading || undefined}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>
          </div>
          {hasFilteredEmpty ? (
            <EmptyState
              title="No loans match your filters."
              body="Try a different status filter or search term."
            />
          ) : (
            <div className={loading ? 'loan-table-loading' : undefined}>
              <AdminLoanTable
                loans={loans}
                sortField={appliedQuery.sortField}
                sortDirection={appliedQuery.sortDirection}
                loading={loading}
                returningLoanId={returningLoanId}
                onSort={(field) => replaceQuery(nextLoanSort(appliedQuery, field))}
                onMarkReturned={(loan) => {
                  setSuccessMessage(null);
                  setReturnError(null);
                  setLoanToReturn(loan);
                }}
              />
            </div>
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
            Mark &quot;{loanToReturn.bookTitle}&quot; as returned for {formatLoanMember(loanToReturn)}?
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
