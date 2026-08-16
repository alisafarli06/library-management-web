import type { Role } from './enums';

export type { Role };

export interface BookDto {
  id?: number;
  title: string;
  isbn: string;
  publishedYear?: number | null;
  authorId: number;
  available?: boolean;
  coverFileId?: number | null;
  coverFileName?: string | null;
  prefaceFileId?: number | null;
  prefaceFileName?: string | null;
}

export interface AuthorDto {
  id?: number;
  name: string;
}

export interface MemberDto {
  id?: number;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
}

export interface FileMetadataDto {
  id: number;
  originalFilename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface LoanDto {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail?: string | null;
  bookId: number;
  bookTitle: string;
  borrowedAt: string;
  returnedAt: string | null;
}

export interface LoanAnalyticsSummaryDto {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  totalBooksBorrowed: number;
  totalMembersWithLoans: number;
}

export interface BookBorrowAnalyticsDto {
  bookId: number;
  bookTitle: string;
  borrowCount: number;
}

export interface AuthorBorrowAnalyticsDto {
  authorId: number;
  authorName: string;
  borrowCount: number;
}

export interface MemberBorrowAnalyticsDto {
  memberId: number;
  memberName: string;
  borrowCount: number;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors: Record<string, string> | null;
}

export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageableObject {
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
  sort: SortObject;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
  pageable: PageableObject;
  sort: SortObject;
}

/** Spring Data `Pageable` query parameters (`page` is 0-based). */
export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface BookSearchQuery extends PageQuery {
  title?: string;
  author?: string;
  publishedAfter?: number;
  yearFrom?: number;
  yearTo?: number;
  available?: boolean;
}

export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  role: Role;
  iat: number;
  exp: number;
}
