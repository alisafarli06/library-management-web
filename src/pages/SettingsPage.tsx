import { Clock, Settings } from 'lucide-react';
import {
  getAccessTokenExpiresAt,
  getCurrentEmail,
  getCurrentRole,
  hasValidAccessSession,
} from '../auth/session';
import { Badge, Card, PageHeader } from '../components/ui/Primitives';
import './DashboardPage.css';

export function SettingsPage() {
  const email = getCurrentEmail();
  const role = getCurrentRole();
  const signedIn = hasValidAccessSession();
  const expiresAt = getAccessTokenExpiresAt();
  const expiresLabel = expiresAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(expiresAt)
    : 'Not available';

  return (
    <div className="dashboard">
      <PageHeader
        title="Settings"
        description="Library preferences and account security for your session."
      />

      <Card>
        <Settings className="dashboard__action-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
        <h2 className="dashboard__section-title">Preferences — coming soon</h2>
        <p className="dashboard__settings-copy">
          Preference controls are not available yet. Account and session details are listed under Security.
        </p>
      </Card>

      <section aria-labelledby="security-heading">
        <h2 id="security-heading" className="dashboard__section-title">
          Security
        </h2>
        <Card>
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
              <dd className="dashboard__status">
                {signedIn ? (
                  <>
                    <span className="dashboard__status-dot" aria-hidden="true" />
                    Authenticated
                  </>
                ) : (
                  'Inactive'
                )}
              </dd>
            </div>
            <div>
              <dt>Access token expires</dt>
              <dd className="dashboard__expiry">
                <Clock className="dashboard__expiry-icon" aria-hidden="true" size={15} strokeWidth={1.75} />
                <span>{expiresLabel}</span>
              </dd>
            </div>
          </dl>
        </Card>
      </section>
    </div>
  );
}
