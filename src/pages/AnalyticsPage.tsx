import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAnalyticsSummary,
  getAuthorAnalytics,
  getBookAnalytics,
  getMemberAnalytics,
} from '../api/admin';
import { errorMessage } from '../components/auth/formErrors';
import { AnalyticsBarChart } from '../components/analytics/AnalyticsBarChart';
import { AnalyticsPagination } from '../components/analytics/AnalyticsPagination';
import { AnalyticsRankedTable } from '../components/analytics/AnalyticsRankedTable';
import {
  analyticsListQueryToSearchParams,
  parseAnalyticsListQuery,
  toAnalyticsPageQuery,
  type AnalyticsListQuery,
} from '../components/analytics/analyticsQuery';
import '../components/analytics/analytics.css';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type {
  AuthorBorrowAnalyticsDto,
  BookBorrowAnalyticsDto,
  LoanAnalyticsSummaryDto,
  MemberBorrowAnalyticsDto,
  Page,
} from '../types/api';

const SUMMARY_METRICS: { key: keyof LoanAnalyticsSummaryDto; label: string }[] = [
  { key: 'totalLoans', label: 'Total Loans' },
  { key: 'activeLoans', label: 'Active Loans' },
  { key: 'returnedLoans', label: 'Returned Loans' },
  { key: 'totalBooksBorrowed', label: 'Distinct Books' },
  { key: 'totalMembersWithLoans', label: 'Distinct Members' },
];

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => parseAnalyticsListQuery(searchParams), [searchParams]);

  const [summary, setSummary] = useState<LoanAnalyticsSummaryDto | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryReload, setSummaryReload] = useState(0);

  const [books, setBooks] = useState<Page<BookBorrowAnalyticsDto> | null>(null);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [booksReload, setBooksReload] = useState(0);

  const [authors, setAuthors] = useState<Page<AuthorBorrowAnalyticsDto> | null>(null);
  const [authorsLoading, setAuthorsLoading] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [authorsReload, setAuthorsReload] = useState(0);

  const [members, setMembers] = useState<Page<MemberBorrowAnalyticsDto> | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersReload, setMembersReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const result = await getAnalyticsSummary();
        if (!cancelled) {
          setSummary(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSummary(null);
          setSummaryError(errorMessage(loadError, 'Unable to load analytics summary.'));
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [summaryReload]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBooksLoading(true);
      setBooksError(null);
      try {
        const result = await getBookAnalytics(toAnalyticsPageQuery(query.booksPage));
        if (!cancelled) {
          setBooks(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setBooks(null);
          setBooksError(errorMessage(loadError, 'Unable to load book analytics.'));
        }
      } finally {
        if (!cancelled) {
          setBooksLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query.booksPage, booksReload]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setAuthorsLoading(true);
      setAuthorsError(null);
      try {
        const result = await getAuthorAnalytics(toAnalyticsPageQuery(query.authorsPage));
        if (!cancelled) {
          setAuthors(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setAuthors(null);
          setAuthorsError(errorMessage(loadError, 'Unable to load author analytics.'));
        }
      } finally {
        if (!cancelled) {
          setAuthorsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query.authorsPage, authorsReload]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setMembersLoading(true);
      setMembersError(null);
      try {
        const result = await getMemberAnalytics(toAnalyticsPageQuery(query.membersPage));
        if (!cancelled) {
          setMembers(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setMembers(null);
          setMembersError(errorMessage(loadError, 'Unable to load member analytics.'));
        }
      } finally {
        if (!cancelled) {
          setMembersLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query.membersPage, membersReload]);

  function replaceQuery(next: AnalyticsListQuery) {
    setSearchParams(analyticsListQueryToSearchParams(next), { replace: true });
  }

  return (
    <div className="analytics-page">
      <PageHeader
        title="Analytics"
        description="Borrowing activity aggregated from loan history."
      />

      <section aria-labelledby="analytics-overview-heading">
        <h2 id="analytics-overview-heading" className="analytics-section__title">
          Overview
        </h2>
        {summaryError ? (
          <div>
            <p className="analytics-alert" role="alert">
              {summaryError}
            </p>
            <Button type="button" variant="secondary" onClick={() => setSummaryReload((value) => value + 1)}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="analytics-metrics">
            {SUMMARY_METRICS.map((metric) => {
              const isActiveLoans = metric.key === 'activeLoans';
              return (
                <Card
                  key={metric.key}
                  className={isActiveLoans ? 'analytics-metric analytics-metric--active' : 'analytics-metric'}
                >
                  <p className="analytics-metric__label">
                    {isActiveLoans ? <span className="analytics-metric__dot" aria-hidden="true" /> : null}
                    {metric.label}
                  </p>
                  <p
                    className={[
                      'analytics-metric__value',
                      summaryLoading || !summary ? 'is-muted' : '',
                      isActiveLoans && summary && !summaryLoading ? 'analytics-metric__value--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {summaryLoading || !summary ? 'Loading…' : summary[metric.key]}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <div className="analytics-sections">
        <RankedSection
          headingId="analytics-books-heading"
          title="Most Borrowed Books"
          nameHeader="Book"
          paginationLabel="Most borrowed books pagination"
          visualization="chart"
          error={booksError}
          loading={booksLoading}
          result={books}
          page={query.booksPage}
          rows={(books?.content ?? []).map((row) => ({
            id: row.bookId,
            name: row.bookTitle,
            borrowCount: row.borrowCount,
          }))}
          emptyTitle="No book borrowing activity yet."
          emptyBody="Book analytics will appear here after loans are recorded."
          onRetry={() => setBooksReload((value) => value + 1)}
          onPrevious={() => replaceQuery({ ...query, booksPage: Math.max(query.booksPage - 1, 0) })}
          onNext={() => replaceQuery({ ...query, booksPage: query.booksPage + 1 })}
        />
        <RankedSection
          headingId="analytics-authors-heading"
          title="Most Borrowed Authors"
          nameHeader="Author"
          paginationLabel="Most borrowed authors pagination"
          visualization="table"
          error={authorsError}
          loading={authorsLoading}
          result={authors}
          page={query.authorsPage}
          rows={(authors?.content ?? []).map((row) => ({
            id: row.authorId,
            name: row.authorName,
            borrowCount: row.borrowCount,
          }))}
          emptyTitle="No author borrowing activity yet."
          emptyBody="Author analytics will appear here after loans are recorded."
          onRetry={() => setAuthorsReload((value) => value + 1)}
          onPrevious={() => replaceQuery({ ...query, authorsPage: Math.max(query.authorsPage - 1, 0) })}
          onNext={() => replaceQuery({ ...query, authorsPage: query.authorsPage + 1 })}
        />
        <RankedSection
          headingId="analytics-members-heading"
          title="Most Active Members"
          nameHeader="Member"
          paginationLabel="Most active members pagination"
          visualization="chart"
          error={membersError}
          loading={membersLoading}
          result={members}
          page={query.membersPage}
          rows={(members?.content ?? []).map((row) => ({
            id: row.memberId,
            name: row.memberName,
            borrowCount: row.borrowCount,
          }))}
          emptyTitle="No member borrowing activity yet."
          emptyBody="Member analytics will appear here after loans are recorded."
          onRetry={() => setMembersReload((value) => value + 1)}
          onPrevious={() => replaceQuery({ ...query, membersPage: Math.max(query.membersPage - 1, 0) })}
          onNext={() => replaceQuery({ ...query, membersPage: query.membersPage + 1 })}
        />
      </div>
    </div>
  );
}

interface RankedSectionProps {
  headingId: string;
  title: string;
  nameHeader: string;
  paginationLabel: string;
  visualization: 'chart' | 'table';
  error: string | null;
  loading: boolean;
  result: Page<{ borrowCount: number }> | null;
  page: number;
  rows: { id: number; name: string; borrowCount: number }[];
  emptyTitle: string;
  emptyBody: string;
  onRetry: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

function RankedSection({
  headingId,
  title,
  nameHeader,
  paginationLabel,
  visualization,
  error,
  loading,
  result,
  page,
  rows,
  emptyTitle,
  emptyBody,
  onRetry,
  onPrevious,
  onNext,
}: RankedSectionProps) {
  const isEmpty = !error && !loading && Boolean(result) && rows.length === 0;
  const totalPages = result?.totalPages ?? 0;
  const showPagination = !error && !isEmpty && totalPages > 1;

  return (
    <section aria-labelledby={headingId} className="analytics-ranked-section">
      <Card>
        <h2 id={headingId} className="analytics-section__title">
          {title}
        </h2>
        {error ? (
          <div>
            <p className="analytics-alert" role="alert">
              {error}
            </p>
            <Button type="button" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
        {isEmpty ? <EmptyState title={emptyTitle} body={emptyBody} /> : null}
        {!error && (loading || rows.length > 0) ? (
          <>
            {loading && rows.length === 0 ? (
              <p className="analytics-chart__loading">Loading analytics…</p>
            ) : visualization === 'chart' ? (
              <>
                <AnalyticsBarChart rows={rows} label="Borrow count" />
                <AnalyticsRankedTable nameHeader={nameHeader} rows={rows} loading={false} />
              </>
            ) : (
              <AnalyticsRankedTable nameHeader={nameHeader} rows={rows} loading={loading} />
            )}
            {showPagination ? (
              <AnalyticsPagination
                page={result?.number ?? page}
                totalPages={totalPages}
                totalElements={result?.totalElements ?? 0}
                disabled={loading}
                label={paginationLabel}
                onPrevious={onPrevious}
                onNext={onNext}
              />
            ) : null}
          </>
        ) : null}
      </Card>
    </section>
  );
}
