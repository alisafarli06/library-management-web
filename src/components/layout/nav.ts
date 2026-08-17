import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Clock,
  LayoutDashboard,
  Settings,
  UserPen,
  Users,
} from 'lucide-react';
import type { Role } from '../../types/enums';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/books', label: 'Books', icon: BookOpen },
  { to: '/my-loans', label: 'My Loans', icon: Clock },
  { to: '/loans', label: 'Loans', icon: ArrowLeftRight, adminOnly: true },
  { to: '/authors', label: 'Authors', icon: UserPen },
  { to: '/members', label: 'Members', icon: Users, adminOnly: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/books': 'Books',
  '/my-loans': 'My Loans',
  '/loans': 'Loan Management',
  '/analytics': 'Analytics',
  '/authors': 'Authors',
  '/members': 'Members',
  '/settings': 'Settings',
};

export function getNavItems(role: Role | null): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === 'ADMIN');
}
