export type SortDirection = 'asc' | 'desc';

export type AuthorSortField = 'id' | 'name' | 'bookCount';

export interface AuthorListQuery {
  page: number;
  size: number;
  sortField: AuthorSortField;
  sortDirection: SortDirection;
  q: string;
}

export const DEFAULT_AUTHOR_LIST_QUERY: AuthorListQuery = {
  page: 0,
  size: 20,
  sortField: 'name',
  sortDirection: 'asc',
  q: '',
};

const SORT_FIELDS: AuthorSortField[] = ['id', 'name', 'bookCount'];

function parseSortField(value: string | undefined): AuthorSortField {
  return SORT_FIELDS.includes(value as AuthorSortField)
    ? (value as AuthorSortField)
    : DEFAULT_AUTHOR_LIST_QUERY.sortField;
}

export function parseAuthorListQuery(params: URLSearchParams): AuthorListQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  const size = Number.parseInt(params.get('size') ?? '', 10);
  const sort =
    params.get('sort') ?? `${DEFAULT_AUTHOR_LIST_QUERY.sortField},${DEFAULT_AUTHOR_LIST_QUERY.sortDirection}`;
  const [fieldRaw, directionRaw] = sort.split(',');
  const q = (params.get('q') ?? '').trim();

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size > 0 ? size : DEFAULT_AUTHOR_LIST_QUERY.size,
    sortField: parseSortField(fieldRaw),
    sortDirection: directionRaw === 'desc' ? 'desc' : 'asc',
    q,
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
  params.set('sort', `${query.sortField},${query.sortDirection}`);
  if (query.q) {
    params.set('q', query.q);
  }
  return params;
}

export function toAuthorApiQuery(query: AuthorListQuery): {
  page: number;
  size: number;
  sort: string;
  q?: string;
} {
  return {
    page: query.page,
    size: query.size,
    sort: `${query.sortField},${query.sortDirection}`,
    ...(query.q ? { q: query.q } : {}),
  };
}

export function nextAuthorSort(current: AuthorListQuery, field: AuthorSortField): AuthorListQuery {
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
    sortDirection: 'asc',
  };
}

export function authorQueryHasSearch(query: AuthorListQuery): boolean {
  return query.q.length > 0;
}
