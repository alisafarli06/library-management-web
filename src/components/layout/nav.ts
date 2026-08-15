import type { Role } from '../../types/enums';

interface NavItem {
  to: string;
  label: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/books', label: 'Books' },
  { to: '/authors', label: 'Authors' },
  { to: '/members', label: 'Members', adminOnly: true },
  { to: '/files', label: 'Files' },
];

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/books': 'Books',
  '/authors': 'Authors',
  '/members': 'Members',
  '/files': 'Files',
};

export function getNavItems(role: Role | null): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === 'ADMIN');
}
