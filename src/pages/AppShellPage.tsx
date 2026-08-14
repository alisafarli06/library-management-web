import { useNavigate } from 'react-router-dom';
import { clearSession, getCurrentEmail, getCurrentRole } from '../auth/session';
import './AppShellPage.css';

export function AppShellPage() {
  const navigate = useNavigate();
  const email = getCurrentEmail();
  const role = getCurrentRole();

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <p className="app-shell__name">Library Management</p>
        <div className="app-shell__session">
          <div>
            <p className="app-shell__email">{email ?? 'Unknown user'}</p>
            <p className="app-shell__role">{role ?? 'Unknown role'}</p>
          </div>
          <button type="button" className="app-shell__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="app-shell__main">
        <h1>Authentication successful</h1>
        <p>
          Your access token is stored locally and this route is reserved for signed-in
          staff. Catalogue and member tools will be added here next.
        </p>
      </main>
    </div>
  );
}
