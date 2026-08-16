import type {
  AuthorBorrowAnalyticsDto,
  BookBorrowAnalyticsDto,
  LoanAnalyticsSummaryDto,
  LoanDto,
  MemberBorrowAnalyticsDto,
  Page,
  PageQuery,
} from '../types/api';
import { getJson, getText } from './http';

export function getAdminDashboard(): Promise<string> {
  return getText('/admin/dashboard');
}

export function getLoans(query: PageQuery = {}): Promise<Page<LoanDto>> {
  return getJson<Page<LoanDto>>('/loans', query);
}

export function searchLoans(
  query: PageQuery & { q?: string; status?: string } = {},
): Promise<Page<LoanDto>> {
  return getJson<Page<LoanDto>>('/loans/search', query);
}

export function getAnalyticsSummary(): Promise<LoanAnalyticsSummaryDto> {
  return getJson<LoanAnalyticsSummaryDto>('/admin/analytics/summary');
}

export function getBookAnalytics(query: PageQuery = {}): Promise<Page<BookBorrowAnalyticsDto>> {
  return getJson<Page<BookBorrowAnalyticsDto>>('/admin/analytics/books', query);
}

export function getAuthorAnalytics(query: PageQuery = {}): Promise<Page<AuthorBorrowAnalyticsDto>> {
  return getJson<Page<AuthorBorrowAnalyticsDto>>('/admin/analytics/authors', query);
}

export function getMemberAnalytics(query: PageQuery = {}): Promise<Page<MemberBorrowAnalyticsDto>> {
  return getJson<Page<MemberBorrowAnalyticsDto>>('/admin/analytics/members', query);
}
