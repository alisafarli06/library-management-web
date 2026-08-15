import { getText, postNoContent } from './http';

export function getUserProfile(): Promise<string> {
  return getText('/user/profile');
}

export function borrowOwnBook(bookId: number): Promise<void> {
  return postNoContent(`/user/books/${bookId}/borrow`);
}
