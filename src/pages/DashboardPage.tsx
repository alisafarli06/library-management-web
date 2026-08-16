import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Image,
  Settings,
  UserPen,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAnalyticsSummary } from '../api/admin';
import { listBooks } from '../api/books';
import { listMembers } from '../api/members';
import { getUserLoans } from '../api/user';
import { getCurrentEmail, getCurrentRole } from '../auth/session';
import { errorMessage } from '../components/auth/formErrors';
import { isActiveLoan } from '../components/loans/loanListQuery';
import { Button, PageHeader } from '../components/ui/Primitives';
import './DashboardPage.css';

interface OverviewStats {
  totalBooks: number | null;
  activeLoans: number | null;
  totalMembers: number | null;
  overdueItems: number | null;
}

async function countUserActiveLoans(): Promise<number> {
  let page = 0;
  let active = 0;
  let totalPages = 1;

  while (page < totalPages && page < 20) {
    const result = await getUserLoans({ page, size: 50, sort: 'borrowedAt,desc' });
    active += result.content.filter((loan) => isActiveLoan(loan.returnedAt)).length;
    totalPages = Math.max(result.totalPages, 0);
    page += 1;
  }

  return active;
}

export function DashboardPage() {
  const email = getCurrentEmail();
  const role = getCurrentRole();
  const isAdmin = role === 'ADMIN';
  const [stats, setStats] = useState<OverviewStats>({
    totalBooks: null,
    activeLoans: null,
    totalMembers: null,
    overdueItems: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const booksPromise = listBooks({ page: 0, size: 1 });
        if (isAdmin) {
          const [books, summary, members] = await Promise.all([
            booksPromise,
            getAnalyticsSummary(),
            listMembers({ page: 0, size: 1 }),
          ]);
          if (!cancelled) {
            setStats({
              totalBooks: books.totalElements,
              activeLoans: summary.activeLoans,
              totalMembers: members.totalElements,
              overdueItems: null,
            });
          }
        } else {
          const [books, activeLoans] = await Promise.all([booksPromise, countUserActiveLoans()]);
          if (!cancelled) {
            setStats({
              totalBooks: books.totalElements,
              activeLoans,
              totalMembers: null,
              overdueItems: null,
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStats({
            totalBooks: null,
            activeLoans: null,
            totalMembers: null,
            overdueItems: null,
          });
          setStatsError(errorMessage(error, 'Unable to load library overview.'));
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, reloadToken]);

  function formatStat(value: number | null): string {
    if (statsLoading) {
      return '…';
    }
    if (value == null) {
      return '—';
    }
    return String(value);
  }

  return (
    <div className="dashboard">
      <div className="dashboard__welcome">
        <PageHeader
          title="Welcome back"
          description={
            isAdmin
              ? 'Manage the catalogue, members, and lending from one workspace.'
              : 'Browse the catalogue, keep track of your loans, and download book materials.'
          }
        />
        <p className="dashboard__signed-in">{email ?? 'Signed-in session'}</p>
        <div className="dashboard__primary">
          <Button to="/books">Browse Books</Button>
          <Button to="/my-loans" variant="secondary">
            My Loans
          </Button>
        </div>
      </div>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="dashboard__section-title">
          Library overview
        </h2>
        {statsError ? (
          <div className="dashboard__overview-error">
            <p className="dashboard__settings-copy" role="alert">
              {statsError}
            </p>
            <Button type="button" variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="dashboard__stats">
            <article className="ui-card dashboard__stat-card">
              <BookOpen className="dashboard__stat-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
              <p className="dashboard__stat-value">{formatStat(stats.totalBooks)}</p>
              <p className="dashboard__stat-label">Total Books</p>
            </article>
            <article className="ui-card dashboard__stat-card">
              <ArrowLeftRight className="dashboard__stat-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
              <p className="dashboard__stat-value">{formatStat(stats.activeLoans)}</p>
              <p className="dashboard__stat-label">Active Loans</p>
            </article>
            <article className="ui-card dashboard__stat-card">
              <Users className="dashboard__stat-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
              <p className="dashboard__stat-value">{formatStat(stats.totalMembers)}</p>
              <p className="dashboard__stat-label">Total Members</p>
            </article>
            <article className="ui-card dashboard__stat-card">
              <AlertTriangle className="dashboard__stat-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
              <p className="dashboard__stat-value">{formatStat(stats.overdueItems)}</p>
              <p className="dashboard__stat-label">Overdue Items</p>
            </article>
          </div>
        )}
        {!statsLoading && !statsError ? (
          <p className="dashboard__stats-note">
            Overdue tracking is not provided by the current API, so that metric stays blank.
            {!isAdmin ? ' Member totals are available to administrators only.' : null}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="workspace-heading">
        <h2 id="workspace-heading" className="dashboard__section-title">
          Quick actions
        </h2>
        <div className="dashboard__action-grid">
          <Link to="/authors" className="ui-card dashboard__action-card">
            <UserPen className="dashboard__action-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
            <h3>Authors</h3>
            <p>{isAdmin ? 'Maintain author records for the collection.' : 'Browse authors in the collection.'}</p>
            <span className="ui-button ui-button--secondary dashboard__action-cta" aria-hidden="true">
              {isAdmin ? 'Manage Authors' : 'Browse Authors'}
            </span>
          </Link>
          <Link to="/books" className="ui-card dashboard__action-card">
            <Image className="dashboard__action-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
            <h3>Book materials</h3>
            <p>Covers and prefaces are attached to individual titles in the catalogue.</p>
            <span className="ui-button ui-button--secondary dashboard__action-cta" aria-hidden="true">
              Open catalogue
            </span>
          </Link>
          {isAdmin ? (
            <>
              <Link to="/members" className="ui-card dashboard__action-card">
                <Users className="dashboard__action-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
                <h3>Members</h3>
                <p>Keep borrower records and circulation actions in one place.</p>
                <span className="ui-button ui-button--secondary dashboard__action-cta" aria-hidden="true">
                  Manage Members
                </span>
              </Link>
              <Link to="/loans" className="ui-card dashboard__action-card">
                <ArrowLeftRight className="dashboard__action-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
                <h3>Loans</h3>
                <p>Review borrowing activity across the library.</p>
                <span className="ui-button ui-button--secondary dashboard__action-cta" aria-hidden="true">
                  View loans
                </span>
              </Link>
              <Link to="/analytics" className="ui-card dashboard__action-card">
                <BarChart3 className="dashboard__action-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
                <h3>Analytics</h3>
                <p>See lending summaries and ranked catalogue activity.</p>
                <span className="ui-button ui-button--secondary dashboard__action-cta" aria-hidden="true">
                  Open analytics
                </span>
              </Link>
            </>
          ) : null}
          <Link to="/settings" className="ui-card dashboard__action-card">
            <Settings className="dashboard__action-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
            <h3>Settings</h3>
            <p>Configure library preferences and system options.</p>
            <span className="ui-button ui-button--secondary dashboard__action-cta" aria-hidden="true">
              Open settings
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
