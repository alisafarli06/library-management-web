export type SortDirection = 'asc' | 'desc';

export interface AuthorListQuery {
  page: number;
  size: number;
  sortDirection: SortDirection;
}

export const DEFAULT_AUTHOR_LIST_QUERY: AuthorListQuery = {
  page: 0,
  size: 20,
  sortDirection: 'asc',
};

export function parseAuthorListQuery(params: URLSearchParams): AuthorListQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  const size = Number.parseInt(params.get('size') ?? '', 10);
  const sort = params.get('sort') ?? `name,${DEFAULT_AUTHOR_LIST_QUERY.sortDirection}`;
  const [, directionRaw] = sort.split(',');

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size > 0 ? size : DEFAULT_AUTHOR_LIST_QUERY.size,
    sortDirection: directionRaw === 'desc' ? 'desc' : 'asc',
  };
}

export function authorListQueryToSearchParams(query: AuthorListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 0) {
    params.set('page', String(query.page));
  }
  if (query.size !== DEFAULT_AUTHOR_LIST_QUERY.size) {
    params.set('size', String(query.size));
  }
  params.set('sort', `name,${query.sortDirection}`);
  return params;
}

export function toAuthorApiQuery(query: AuthorListQuery): { page: number; size: number; sort: string } {
  return {
    page: query.page,
    size: query.size,
    sort: `name,${query.sortDirection}`,
  };
}
