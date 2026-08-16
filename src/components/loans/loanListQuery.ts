export type SortDirection = 'asc' | 'desc';
export type LoanStatusFilter = 'all' | 'borrowed' | 'returned';
export type LoanSortField = 'borrowedAt' | 'member.name' | 'book.title' | 'returnedAt';

export interface LoanListQuery {
  page: number;
  size: number;
  sortField: LoanSortField;
  sortDirection: SortDirection;
  q: string;
  status: LoanStatusFilter;
}

export const DEFAULT_LOAN_LIST_QUERY: LoanListQuery = {
  page: 0,
  size: 20,
  sortField: 'borrowedAt',
  sortDirection: 'desc',
  q: '',
  status: 'all',
};

const SORT_FIELDS: LoanSortField[] = ['borrowedAt', 'member.name', 'book.title', 'returnedAt'];
const STATUS_FILTERS: LoanStatusFilter[] = ['all', 'borrowed', 'returned'];

function parseSortField(value: string | undefined): LoanSortField {
  return SORT_FIELDS.includes(value as LoanSortField) ? (value as LoanSortField) : DEFAULT_LOAN_LIST_QUERY.sortField;
}

function parseStatus(value: string | null): LoanStatusFilter {
  return STATUS_FILTERS.includes(value as LoanStatusFilter)
    ? (value as LoanStatusFilter)
    : DEFAULT_LOAN_LIST_QUERY.status;
}

export function parseLoanListQuery(params: URLSearchParams): LoanListQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  const size = Number.parseInt(params.get('size') ?? '', 10);
  const sort = params.get('sort') ?? `${DEFAULT_LOAN_LIST_QUERY.sortField},${DEFAULT_LOAN_LIST_QUERY.sortDirection}`;
  const [fieldRaw, directionRaw] = sort.split(',');

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size > 0 ? size : DEFAULT_LOAN_LIST_QUERY.size,
    sortField: parseSortField(fieldRaw),
    sortDirection: directionRaw === 'asc' ? 'asc' : 'desc',
    q: params.get('q')?.trim() ?? '',
    status: parseStatus(params.get('status')),
  };
}

export function loanListQueryToSearchParams(query: LoanListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 0) {
    params.set('page', String(query.page));
  }
  if (query.size !== DEFAULT_LOAN_LIST_QUERY.size) {
    params.set('size', String(query.size));
  }
  params.set('sort', `${query.sortField},${query.sortDirection}`);
  if (query.q.trim()) {
    params.set('q', query.q.trim());
  }
  if (query.status !== 'all') {
    params.set('status', query.status);
  }
  return params;
}

export function toLoanApiQuery(query: LoanListQuery): {
  page: number;
  size: number;
  sort: string;
  q?: string;
  status: LoanStatusFilter;
} {
  return {
    page: query.page,
    size: query.size,
    sort: `${query.sortField},${query.sortDirection}`,
    status: query.status,
    ...(query.q.trim() ? { q: query.q.trim() } : {}),
  };
}

export function toLoanPageApiQuery(query: LoanListQuery): {
  page: number;
  size: number;
  sort: string;
} {
  return {
    page: query.page,
    size: query.size,
    sort: `${query.sortField},${query.sortDirection}`,
  };
}

export function loanQueryHasFilters(query: LoanListQuery): boolean {
  return query.q.trim() !== '' || query.status !== 'all';
}

export function formatLoanDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function isActiveLoan(returnedAt: string | null): boolean {
  return returnedAt == null;
}

/** Active / returned / overdue (overdue reserved for when due dates exist). */
export type LoanDisplayStatus = 'active' | 'returned' | 'overdue';

export function getLoanDisplayStatus(returnedAt: string | null): LoanDisplayStatus {
  if (!isActiveLoan(returnedAt)) {
    return 'returned';
  }
  return 'active';
}

export function loanStatusLabel(status: LoanDisplayStatus): string {
  if (status === 'returned') {
    return 'Returned';
  }
  if (status === 'overdue') {
    return 'Overdue';
  }
  return 'Currently Borrowed';
}

export function loanStatusTone(status: LoanDisplayStatus): 'success' | 'info' | 'danger' {
  if (status === 'returned') {
    return 'success';
  }
  if (status === 'overdue') {
    return 'danger';
  }
  return 'info';
}

export function isGenericLoanMemberName(name: string | null | undefined): boolean {
  const trimmed = name?.trim() ?? '';
  return !trimmed || /^borrower(?:\s+user)?$/i.test(trimmed);
}

export function formatLoanMember(loan: {
  memberName: string;
  memberEmail?: string | null;
}): string {
  const name = loan.memberName?.trim() ?? '';
  const email = loan.memberEmail?.trim() ?? '';

  if (isGenericLoanMemberName(name) && email) {
    return email;
  }
  if (name && email) {
    return `${name} (${email})`;
  }
  if (name) {
    return name;
  }
  if (email) {
    return email;
  }
  return 'Unknown member';
}

export function loanMemberDisplay(loan: {
  memberName: string;
  memberEmail?: string | null;
}): { primary: string; secondary: string | null } {
  const name = loan.memberName?.trim() ?? '';
  const email = loan.memberEmail?.trim() ?? '';

  if (isGenericLoanMemberName(name)) {
    return { primary: email || 'Unknown member', secondary: null };
  }
  return { primary: name || email || 'Unknown member', secondary: email || null };
}

export function loanMatchesSearch(
  loan: { memberName: string; bookTitle: string; memberEmail?: string | null },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  if (loan.bookTitle.toLowerCase().includes(needle)) {
    return true;
  }
  if (loan.memberName.toLowerCase().includes(needle)) {
    return true;
  }
  return Boolean(loan.memberEmail?.toLowerCase().includes(needle));
}

export function nextLoanSort(
  current: LoanListQuery,
  field: LoanSortField,
): LoanListQuery {
  if (current.sortField === field) {
    return {
      ...current,
      page: 0,
      sortDirection: current.sortDirection === 'desc' ? 'asc' : 'desc',
    };
  }
  return {
    ...current,
    page: 0,
    sortField: field,
    sortDirection: field === 'borrowedAt' || field === 'returnedAt' ? 'desc' : 'asc',
  };
}
