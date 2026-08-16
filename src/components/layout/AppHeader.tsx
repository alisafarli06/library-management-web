import { Badge, Button } from '../ui/Primitives';

interface AppHeaderProps {
  title: string;
  email: string | null;
  role: string | null;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export function AppHeader({
  title,
  email,
  role,
  menuOpen,
  onToggleMenu,
  onLogout,
}: AppHeaderProps) {
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
      <div className="app-header__user">
        <p className="app-header__email">{email ?? 'Unknown user'}</p>
        {role ? (
          <Badge className="app-header__role" tone="neutral">
            {role}
          </Badge>
        ) : null}
        <Button variant="ghost" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
