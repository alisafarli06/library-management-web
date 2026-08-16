import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { getInitials } from '../../auth/displayName';
import { Badge } from '../ui/Primitives';

interface AppHeaderProps {
  title: string;
  displayName: string;
  role: string | null;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export function AppHeader({
  title,
  displayName,
  role,
  menuOpen,
  onToggleMenu,
  onLogout,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const menuId = `${reactId}-user-menu`;
  const triggerId = `${reactId}-user-menu-trigger`;
  const initials = getInitials(displayName);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [title]);

  useEffect(() => {
    if (!userMenuOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (target && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  function handleSettings() {
    setUserMenuOpen(false);
    navigate('/settings');
  }

  function handleLogout() {
    setUserMenuOpen(false);
    onLogout();
  }

  return (
    <header className="app-header">
      <div className="app-header__lead">
        <button
          type="button"
          className="app-header__menu"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          onClick={onToggleMenu}
        >
          Menu
        </button>
        <div>
          <p className="app-header__crumb">Library Management</p>
          <p className="app-header__title">{title}</p>
        </div>
      </div>

      <div className="app-header__user" ref={userMenuRef}>
        <button
          type="button"
          id={triggerId}
          className="app-user-menu__trigger"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          aria-controls={menuId}
          aria-label={`Account menu for ${displayName}`}
          onClick={() => setUserMenuOpen((open) => !open)}
        >
          <span className="app-user-menu__avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="app-user-menu__name">{displayName}</span>
          {role ? (
            <Badge className="app-header__role" tone="neutral">
              {role}
            </Badge>
          ) : null}
          <ChevronDown
            className={['app-user-menu__chevron', userMenuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>

        {userMenuOpen ? (
          <div className="app-user-menu__dropdown" role="menu" id={menuId} aria-labelledby={triggerId}>
            <button type="button" role="menuitem" className="app-user-menu__item" onClick={handleSettings}>
              <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="app-user-menu__item app-user-menu__item--danger"
              onClick={handleLogout}
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
