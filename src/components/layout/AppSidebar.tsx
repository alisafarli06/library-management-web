import { NavLink } from 'react-router-dom';
import { getCurrentRole } from '../../auth/session';
import { BookshelfMark } from '../auth/icons';
import { getNavItems } from './nav';

interface AppSidebarProps {
  id: string;
  onNavigate?: () => void;
}

export function AppSidebar({ id, onNavigate }: AppSidebarProps) {
  const items = getNavItems(getCurrentRole());

  return (
    <aside className="app-sidebar" id={id}>
      <div className="app-sidebar__brand">
        <BookshelfMark />
        <div>
          <p className="app-sidebar__mark">Library Management</p>
          <p className="app-sidebar__tag">Library platform</p>
        </div>
      </div>
      <nav className="app-sidebar__nav" aria-label="Application">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                ['app-sidebar__link', isActive ? 'is-active' : ''].filter(Boolean).join(' ')
              }
              onClick={onNavigate}
            >
              <Icon className="app-sidebar__icon" aria-hidden="true" size={17} strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
