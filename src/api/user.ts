import type { LoanDto, Page, PageQuery } from '../types/api';
import { getJson, getText, postNoContent } from './http';

export function getUserProfile(): Promise<string> {
  return getText('/user/profile');
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
