export const ANALYTICS_PAGE_SIZE = 10;

export interface AnalyticsListQuery {
  booksPage: number;
  authorsPage: number;
  membersPage: number;
}

export const DEFAULT_ANALYTICS_LIST_QUERY: AnalyticsListQuery = {
  booksPage: 0,
  authorsPage: 0,
  membersPage: 0,
};

function parsePage(raw: string | null): number {
  const page = Number.parseInt(raw ?? '', 10);
  return Number.isInteger(page) && page >= 0 ? page : 0;
}

export function parseAnalyticsListQuery(params: URLSearchParams): AnalyticsListQuery {
  return {
    booksPage: parsePage(params.get('booksPage')),
    authorsPage: parsePage(params.get('authorsPage')),
    membersPage: parsePage(params.get('membersPage')),
  };
}

export function analyticsListQueryToSearchParams(query: AnalyticsListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.booksPage !== 0) {
    params.set('booksPage', String(query.booksPage));
  }
  if (query.authorsPage !== 0) {
    params.set('authorsPage', String(query.authorsPage));
  }
  if (query.membersPage !== 0) {
    params.set('membersPage', String(query.membersPage));
  }
  return params;
}

export function toAnalyticsPageQuery(page: number): { page: number; size: number } {
  return { page, size: ANALYTICS_PAGE_SIZE };
}
