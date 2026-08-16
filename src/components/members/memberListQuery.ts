export type SortDirection = 'asc' | 'desc';

export type MemberSortField = 'name' | 'email';

export interface MemberListQuery {
  page: number;
  size: number;
  sortField: MemberSortField;
  sortDirection: SortDirection;
  q: string;
}

export const DEFAULT_MEMBER_LIST_QUERY: MemberListQuery = {
  page: 0,
  size: 20,
  sortField: 'name',
  sortDirection: 'asc',
  q: '',
};

const SORT_FIELDS: MemberSortField[] = ['name', 'email'];

function parseSortField(value: string | undefined): MemberSortField {
  return SORT_FIELDS.includes(value as MemberSortField)
    ? (value as MemberSortField)
    : DEFAULT_MEMBER_LIST_QUERY.sortField;
}

export function parseMemberListQuery(params: URLSearchParams): MemberListQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  const size = Number.parseInt(params.get('size') ?? '', 10);
  const sort =
    params.get('sort') ?? `${DEFAULT_MEMBER_LIST_QUERY.sortField},${DEFAULT_MEMBER_LIST_QUERY.sortDirection}`;
  const [fieldRaw, directionRaw] = sort.split(',');
  const q = (params.get('q') ?? '').trim();

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size > 0 ? size : DEFAULT_MEMBER_LIST_QUERY.size,
    sortField: parseSortField(fieldRaw),
    sortDirection: directionRaw === 'desc' ? 'desc' : 'asc',
    q,
  };
}

export function memberListQueryToSearchParams(query: MemberListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 0) {
    params.set('page', String(query.page));
  }
  if (query.size !== DEFAULT_MEMBER_LIST_QUERY.size) {
    params.set('size', String(query.size));
  }
  params.set('sort', `${query.sortField},${query.sortDirection}`);
  if (query.q) {
    params.set('q', query.q);
  }
  return params;
}

export function toMemberApiQuery(query: MemberListQuery): {
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

export function nextMemberSort(current: MemberListQuery, field: MemberSortField): MemberListQuery {
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

export function memberQueryHasSearch(query: MemberListQuery): boolean {
  return query.q.length > 0;
}

/** True when name is blank or is just a duplicate of the email. */
export function memberHasPlaceholderName(member: { name: string; email: string }): boolean {
  const name = member.name.trim();
  const email = member.email.trim();
  return !name || name.toLowerCase() === email.toLowerCase();
}

export function memberDisplayName(member: { name: string; email: string }): string {
  return memberHasPlaceholderName(member) ? 'No name set' : member.name.trim();
}

export function memberActionLabel(member: { name: string; email: string }): string {
  return memberHasPlaceholderName(member) ? member.email.trim() : member.name.trim();
}
