import type { Role } from '../../types/enums';

interface NavItem {
  to: string;
  label: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/books', label: 'Books' },
  { to: '/my-loans', label: 'My Loans' },
  { to: '/loans', label: 'Loans', adminOnly: true },
  { to: '/authors', label: 'Authors' },
  { to: '/members', label: 'Members', adminOnly: true },
  { to: '/files', label: 'Files' },
  { to: '/analytics', label: 'Analytics', adminOnly: true },
];

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/books': 'Books',
  '/my-loans': 'My Loans',
  '/loans': 'Loan Management',
  '/analytics': 'Analytics',
  '/authors': 'Authors',
  '/members': 'Members',
  '/files': 'Files',
};

export function getNavItems(role: Role | null): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === 'ADMIN');
}
