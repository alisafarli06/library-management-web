import { getText } from './http';

export function getAdminDashboard(): Promise<string> {
  return getText('/admin/dashboard');
}
