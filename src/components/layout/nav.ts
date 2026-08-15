export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/books', label: 'Books' },
  { to: '/authors', label: 'Authors' },
  { to: '/members', label: 'Members' },
  { to: '/files', label: 'Files' },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/books': 'Books',
  '/authors': 'Authors',
  '/members': 'Members',
  '/files': 'Files',
};
