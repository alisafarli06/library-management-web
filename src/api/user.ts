import type { UpdateProfileRequest, UserProfileDto } from '../types/api';
import { getJson, patchJson, postNoContent } from './http';
import type { LoanDto, Page, PageQuery } from '../types/api';

export function getUserProfile(): Promise<UserProfileDto> {
  return getJson<UserProfileDto>('/user/profile');
}

export function updateUserProfile(body: UpdateProfileRequest): Promise<UserProfileDto> {
  return patchJson<UserProfileDto>('/user/profile', body);
}

export function borrowOwnBook(bookId: number): Promise<void> {
  return postNoContent(`/user/books/${bookId}/borrow`);
}

export function getUserLoans(query: PageQuery = {}): Promise<Page<LoanDto>> {
  return getJson<Page<LoanDto>>('/user/loans', query);
}

export function returnOwnBook(bookId: number): Promise<void> {
  return postNoContent(`/user/books/${bookId}/return`);
}
