import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../api/user';
import { resolveDisplayName } from '../../auth/displayName';
import { clearSession, getCurrentEmail, getCurrentRole } from '../../auth/session';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { PAGE_TITLES } from './nav';
import './AppLayout.css';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const email = getCurrentEmail();
  const role = getCurrentRole();
  const [displayName, setDisplayName] = useState(() => resolveDisplayName(null, email));
  const title = PAGE_TITLES[location.pathname] ?? 'Library Management';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
  }, [email, location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className={menuOpen ? 'app-frame is-nav-open' : 'app-frame'}>
      <AppSidebar id="app-sidebar" onNavigate={() => setMenuOpen(false)} />
      {menuOpen ? (
        <button
          type="button"
          className="app-frame__backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="app-frame__main">
        <AppHeader
          title={title}
          displayName={displayName}
          role={role}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((open) => !open)}
          onLogout={handleLogout}
        />
        <div className="app-frame__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
