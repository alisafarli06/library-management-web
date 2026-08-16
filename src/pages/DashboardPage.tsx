import { Link } from 'react-router-dom';
import {
  getAccessTokenExpiresAt,
  getCurrentEmail,
  getCurrentRole,
  hasValidAccessSession,
} from '../auth/session';
import { Badge, Button, Card, PageHeader } from '../components/ui/Primitives';
import './DashboardPage.css';

const AREAS = [
  {
    to: '/books',
    title: 'Books',
    copy: 'Catalogue titles, ISBNs, publication years, and author links.',
  },
  {
    to: '/authors',
    title: 'Authors',
    copy: 'Names attached to titles in the collection.',
  },
  {
    to: '/members',
    title: 'Members',
    copy: 'Keep borrower records and circulation actions in one place.',
  },
] as const;

export function DashboardPage() {
  const email = getCurrentEmail();
  const role = getCurrentRole();
  const canManageMembers = role === 'ADMIN';
  const areas = AREAS.filter((area) => area.to !== '/members' || canManageMembers);
  const signedIn = hasValidAccessSession();
  const expiresAt = getAccessTokenExpiresAt();
  const expiresLabel = expiresAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(expiresAt)
    : 'Not available';

  return (
    <div className="dashboard">
      <PageHeader
        title="Welcome back"
        description={email ?? 'Signed-in staff session'}
      />

      <section className="dashboard__actions" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="dashboard__section-title">
          Quick actions
        </h2>
        <div className="dashboard__action-grid">
          <Card>
            <h3>Browse Books</h3>
            <p>Open the catalogue workspace.</p>
            <Button to="/books" variant="secondary">
              Go to Books
            </Button>
          </Card>
          <Card>
            <h3>{canManageMembers ? 'Manage Authors' : 'Browse Authors'}</h3>
            <p>{canManageMembers ? 'Open the author records workspace.' : 'Open the author list.'}</p>
            <Button to="/authors" variant="secondary">
              Go to Authors
            </Button>
          </Card>
          {canManageMembers ? (
            <Card>
              <h3>Manage Members</h3>
              <p>Open membership and borrowing tools.</p>
              <Button to="/members" variant="secondary">
                Go to Members
              </Button>
            </Card>
          ) : null}
        </div>
      </section>

      <div className="dashboard__split">
        <Card>
          <h2 className="dashboard__section-title">Session</h2>
          <dl className="dashboard__meta">
            <div>
              <dt>Email</dt>
              <dd>{email ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{role ? <Badge>{role}</Badge> : 'Unknown'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{signedIn ? 'Authenticated' : 'Inactive'}</dd>
            </div>
            <div>
              <dt>Access token expires</dt>
              <dd>{expiresLabel}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="dashboard__section-title">Library overview</h2>
          <ul className="dashboard__areas">
            {areas.map((area) => (
              <li key={area.to}>
                <Link to={area.to}>{area.title}</Link>
                <p>{area.copy}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
