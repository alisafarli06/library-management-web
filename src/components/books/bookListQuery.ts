export const BOOK_SORT_FIELDS = ['title', 'isbn', 'publishedYear', 'id'] as const;

export type BookSortField = (typeof BOOK_SORT_FIELDS)[number];
export type SortDirection = 'asc' | 'desc';
export type AvailableFilter = '' | 'true' | 'false';

export interface BookListQuery {
  page: number;
  size: number;
  sortField: BookSortField;
  sortDirection: SortDirection;
  title: string;
  author: string;
  authorId: string;
  authorName: string;
  yearFrom: string;
  yearTo: string;
  available: AvailableFilter;
}

export const DEFAULT_BOOK_LIST_QUERY: BookListQuery = {
  page: 0,
  size: 20,
  sortField: 'title',
  sortDirection: 'asc',
  title: '',
  author: '',
  authorId: '',
  authorName: '',
  yearFrom: '',
  yearTo: '',
  available: '',
};

export function isBookSortField(value: string): value is BookSortField {
  return (BOOK_SORT_FIELDS as readonly string[]).includes(value);
}

export function parseBookListQuery(params: URLSearchParams): BookListQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  const size = Number.parseInt(params.get('size') ?? '', 10);
  const sort = params.get('sort') ?? `${DEFAULT_BOOK_LIST_QUERY.sortField},${DEFAULT_BOOK_LIST_QUERY.sortDirection}`;
  const [fieldRaw, directionRaw] = sort.split(',');
  const availableRaw = params.get('available');

  const authorId = params.get('authorId') ?? '';
  const authorName = params.get('authorName') ?? '';
  const authorParam = params.get('author');

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size > 0 ? size : 20,
    sortField: isBookSortField(fieldRaw) ? fieldRaw : 'title',
    sortDirection: directionRaw === 'desc' ? 'desc' : 'asc',
    title: params.get('title') ?? '',
    author: authorParam ?? (authorId && authorName ? authorName : ''),
    authorId,
    authorName,
    yearFrom: params.get('yearFrom') ?? '',
    yearTo: params.get('yearTo') ?? '',
    available: availableRaw === 'true' || availableRaw === 'false' ? availableRaw : '',
  };
}

export function bookListQueryToSearchParams(query: BookListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 0) {
    params.set('page', String(query.page));
  }
  if (query.size !== 20) {
    params.set('size', String(query.size));
  }
  params.set('sort', `${query.sortField},${query.sortDirection}`);
  if (query.title) {
    params.set('title', query.title);
  }
  if (query.author) {
    params.set('author', query.author);
  }
  if (query.authorId) {
    params.set('authorId', query.authorId);
  }
  if (query.authorName) {
    params.set('authorName', query.authorName);
  }
  if (query.yearFrom) {
    params.set('yearFrom', query.yearFrom);
  }
  if (query.yearTo) {
    params.set('yearTo', query.yearTo);
  }
  if (query.available === 'true' || query.available === 'false') {
    params.set('available', query.available);
  }
  return params;
}

export function hasActiveFilters(query: BookListQuery): boolean {
  return (
    query.title.length > 0 ||
    query.author.length > 0 ||
    query.authorId.length > 0 ||
    query.yearFrom.length > 0 ||
    query.yearTo.length > 0 ||
    query.available !== ''
  );
}

export function authorFilterLabel(query: BookListQuery): string | null {
  if (query.authorId) {
    return query.authorName.trim() || `Author #${query.authorId}`;
  }
  const author = query.author.trim();
  return author.length > 0 ? author : null;
}

export function clearAuthorFilter(query: BookListQuery): BookListQuery {
  return {
    ...query,
    page: 0,
    author: '',
    authorId: '',
    authorName: '',
  };
}

export function parseOptionalYear(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) ? year : undefined;
}
