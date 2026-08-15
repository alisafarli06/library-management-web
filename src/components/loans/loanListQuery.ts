export type SortDirection = 'asc' | 'desc';
export type LoanStatusFilter = 'all' | 'borrowed' | 'returned';

export interface LoanListQuery {
  page: number;
  size: number;
  sortDirection: SortDirection;
}

export const DEFAULT_LOAN_LIST_QUERY: LoanListQuery = {
  page: 0,
  size: 20,
  sortDirection: 'desc',
};

export function parseLoanListQuery(params: URLSearchParams): LoanListQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  const size = Number.parseInt(params.get('size') ?? '', 10);
  const sort = params.get('sort') ?? `borrowedAt,${DEFAULT_LOAN_LIST_QUERY.sortDirection}`;
  const [fieldRaw, directionRaw] = sort.split(',');

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size > 0 ? size : DEFAULT_LOAN_LIST_QUERY.size,
    sortDirection: fieldRaw === 'borrowedAt' && directionRaw === 'asc' ? 'asc' : 'desc',
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
  params.set('sort', `borrowedAt,${query.sortDirection}`);
  return params;
}

export function toLoanApiQuery(query: LoanListQuery): { page: number; size: number; sort: string } {
  return {
    page: query.page,
    size: query.size,
    sort: `borrowedAt,${query.sortDirection}`,
  };
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
