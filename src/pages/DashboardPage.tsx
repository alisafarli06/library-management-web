import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  Search,
  Settings,
  UserPen,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAnalyticsSummary } from '../api/admin';
import { listBooks } from '../api/books';
import { listMembers } from '../api/members';
import { getUserLoans, getUserProfile } from '../api/user';
import { getGreetingName, resolveDisplayName } from '../auth/displayName';
import { getCurrentEmail, getCurrentRole } from '../auth/session';
import { errorMessage } from '../components/auth/formErrors';
import { isActiveLoan } from '../components/loans/loanListQuery';
import { Button } from '../components/ui/Primitives';
import type { LoanDto } from '../types/api';
import './DashboardPage.css';

interface OverviewStats {
  totalBooks: number | null;
  activeLoans: number | null;
  totalMembers: number | null;
}

interface UserLoanOverview {
  active: number;
  recent: LoanDto[];
}

async function loadUserLoanOverview(): Promise<UserLoanOverview> {
  let page = 0;
  let active = 0;
  let totalPages = 1;
  let recent: LoanDto[] = [];

  while (page < totalPages && page < 20) {
    const result = await getUserLoans({ page, size: 50, sort: 'borrowedAt,desc' });
    if (page === 0) {
      recent = result.content.slice(0, 3);
    }
    active += result.content.filter((loan) => isActiveLoan(loan.returnedAt)).length;
    totalPages = Math.max(result.totalPages, 0);
    page += 1;
  }

  return { active, recent };
}

function formatBorrowedDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function formatStat(value: number | null, loading: boolean): string {
  if (loading) {
    return '…';
  }
  if (value == null) {
    return '—';
  }
  return String(value);
}

export function DashboardPage() {
  const email = getCurrentEmail();
  const role = getCurrentRole();
  const isAdmin = role === 'ADMIN';
  const [displayName, setDisplayName] = useState(() => resolveDisplayName(null, email));
  const [stats, setStats] = useState<OverviewStats>({
    totalBooks: null,
    activeLoans: null,
    totalMembers: null,
  });
  const [recentLoans, setRecentLoans] = useState<LoanDto[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const profile = await getUserProfile();
        if (!cancelled) {
          setDisplayName(resolveDisplayName(profile.name, profile.email ?? email));
        }
      } catch {
        if (!cancelled) {
          setDisplayName(resolveDisplayName(null, email));
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [email]);

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
            });
            setRecentLoans([]);
          }
        } else {
          const [books, loanOverview] = await Promise.all([booksPromise, loadUserLoanOverview()]);
          if (!cancelled) {
            setStats({
              totalBooks: books.totalElements,
              activeLoans: loanOverview.active,
              totalMembers: null,
            });
            setRecentLoans(loanOverview.recent);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStats({
            totalBooks: null,
            activeLoans: null,
            totalMembers: null,
          });
          setRecentLoans([]);
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

  const greetingName = getGreetingName(displayName);
  const activeLoans = stats.activeLoans;

  return (
    <div className={['dashboard', isAdmin ? 'dashboard--admin' : 'dashboard--user'].join(' ')}>
      <section className="dashboard__welcome" aria-labelledby="dashboard-welcome-heading">
        <header className="dashboard__hero">
          <h1 id="dashboard-welcome-heading" className="dashboard__hero-title">
            Welcome back, {greetingName}
          </h1>
          <p className="dashboard__hero-copy">
            {isAdmin
              ? 'Manage the catalogue, members, and lending from one workspace.'
              : 'Explore the library, discover something new, and keep track of your borrowed books.'}
          </p>
        </header>
        <div className="dashboard__primary">
          <Button to="/books">Browse Books</Button>
          <Button to={isAdmin ? '/loans' : '/my-loans'} variant="secondary">
            {isAdmin ? 'View Loans' : 'My Loans'}
          </Button>
        </div>
      </section>

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
          <div className={['dashboard__stats', isAdmin ? 'dashboard__stats--admin' : 'dashboard__stats--user'].join(' ')}>
            <article className="ui-card dashboard__stat-card">
              <p className="dashboard__stat-label">Total books</p>
              <p className="dashboard__stat-value">{formatStat(stats.totalBooks, statsLoading)}</p>
              <p className="dashboard__stat-hint">In the catalogue</p>
            </article>

            {isAdmin ? (
              <>
                <article className="ui-card dashboard__stat-card">
                  <p className="dashboard__stat-label">Active loans</p>
                  <p className="dashboard__stat-value">{formatStat(stats.activeLoans, statsLoading)}</p>
                  <p className="dashboard__stat-hint">Across the library</p>
                </article>
                <article className="ui-card dashboard__stat-card">
                  <p className="dashboard__stat-label">Total members</p>
                  <p className="dashboard__stat-value">{formatStat(stats.totalMembers, statsLoading)}</p>
                  <p className="dashboard__stat-hint">Registered borrowers</p>
                </article>
              </>
            ) : (
              <Link to="/my-loans" className="ui-card dashboard__stat-card dashboard__stat-card--link">
                <p className="dashboard__stat-label">My active loans</p>
                <p className="dashboard__stat-value">{formatStat(activeLoans, statsLoading)}</p>
                <p className="dashboard__stat-hint">
                  {statsLoading
                    ? 'Loading…'
                    : activeLoans === 0
                      ? 'Nothing borrowed right now'
                      : 'Currently borrowed'}
                </p>
                <span className="dashboard__stat-cta">
                  {activeLoans === 0 ? 'Browse books →' : 'View loans →'}
                </span>
              </Link>
            )}
          </div>
        )}
      </section>

      {!isAdmin && !statsLoading && !statsError && recentLoans.length > 0 ? (
        <section aria-labelledby="recent-loans-heading">
          <h2 id="recent-loans-heading" className="dashboard__section-title">
            Your recent loans
          </h2>
          <ul className="dashboard__recent-list">
            {recentLoans.map((loan) => (
              <li key={loan.id}>
                <Link to="/my-loans" className="ui-card dashboard__recent-card">
                  <div className="dashboard__recent-copy">
                    <p className="dashboard__recent-title">{loan.bookTitle}</p>
                    <p className="dashboard__recent-meta">
                      {isActiveLoan(loan.returnedAt)
                        ? `Borrowed ${formatBorrowedDay(loan.borrowedAt)}`
                        : `Returned · borrowed ${formatBorrowedDay(loan.borrowedAt)}`}
                    </p>
                  </div>
                  <span className="dashboard__recent-cta">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="workspace-heading">
        <h2 id="workspace-heading" className="dashboard__section-title">
          Quick actions
        </h2>
        <div className="dashboard__action-grid">
          {isAdmin ? (
            <>
              <ActionCard
                to="/books"
                icon={<BookOpen aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Books"
                description="Maintain catalogue titles, availability, and attached materials."
                cta="Manage Books"
              />
              <ActionCard
                to="/authors"
                icon={<UserPen aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Authors"
                description="Maintain author records for the collection."
                cta="Manage Authors"
              />
              <ActionCard
                to="/members"
                icon={<Users aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Members"
                description="Keep borrower records and circulation actions in one place."
                cta="Manage Members"
              />
              <ActionCard
                to="/loans"
                icon={<ArrowLeftRight aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Loans"
                description="Review borrowing activity across the library."
                cta="View loans"
              />
              <ActionCard
                to="/analytics"
                icon={<BarChart3 aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Analytics"
                description="See lending summaries and ranked catalogue activity."
                cta="Open analytics"
              />
              <ActionCard
                to="/settings"
                icon={<Settings aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Settings"
                description="Manage your profile, security, and appearance."
                cta="Open settings"
                secondary
              />
            </>
          ) : (
            <>
              <ActionCard
                to="/books"
                icon={<Search aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Browse books"
                description="Explore the library catalogue and find your next book."
                cta="Browse Books"
              />
              <ActionCard
                to="/my-loans"
                icon={<Clock aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="My loans"
                description="View the books you currently have borrowed."
                cta="View My Loans"
              />
              <ActionCard
                to="/authors"
                icon={<UserPen aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Authors"
                description="Explore authors and discover their books."
                cta="Browse Authors"
              />
              <ActionCard
                to="/books"
                icon={<FileText aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Book materials"
                description="Access covers, PDFs, and other available materials."
                cta="Open Materials"
              />
              <ActionCard
                to="/settings"
                icon={<Settings aria-hidden="true" size={18} strokeWidth={1.75} />}
                title="Settings"
                description="Update your profile, password, and appearance."
                cta="Open settings"
                secondary
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  description,
  cta,
  secondary = false,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  secondary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={['ui-card', 'dashboard__action-card', secondary ? 'dashboard__action-card--secondary' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <span className="dashboard__action-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="ui-button ui-button--secondary dashboard__action-cta" aria-hidden="true">
        {cta}
      </span>
    </Link>
  );
}
