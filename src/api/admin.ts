import type { LoanDto, Page, PageQuery } from '../types/api';
import { getJson, getText } from './http';

export function getAdminDashboard(): Promise<string> {
  return getText('/admin/dashboard');
}

export function getLoans(query: PageQuery = {}): Promise<Page<LoanDto>> {
  return getJson<Page<LoanDto>>('/loans', query);
}
