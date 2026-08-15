import { NavLink } from 'react-router-dom';
import { getCurrentRole } from '../../auth/session';
import { getNavItems } from './nav';

interface AppSidebarProps {
  id: string;
  onNavigate?: () => void;
}

export function AppSidebar({ id, onNavigate }: AppSidebarProps) {
  const items = getNavItems(getCurrentRole());

  return (
    <aside className="app-sidebar" id={id}>
      <p className="app-sidebar__brand">Library Management</p>
      <nav className="app-sidebar__nav" aria-label="Application">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              ['app-sidebar__link', isActive ? 'is-active' : ''].filter(Boolean).join(' ')
            }
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
