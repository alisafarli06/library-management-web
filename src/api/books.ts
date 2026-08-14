import type { BookDto, BookSearchQuery, Page, PageQuery } from '../types/api';
import { deleteNoContent, getJson, postJson, putJson } from './http';

export function listBooks(query: PageQuery = {}): Promise<Page<BookDto>> {
  return getJson<Page<BookDto>>('/books', query);
}

export function searchBooks(query: BookSearchQuery = {}): Promise<Page<BookDto>> {
  return getJson<Page<BookDto>>('/books/search', query);
}

export function getBook(id: number): Promise<BookDto> {
  return getJson<BookDto>(`/books/${id}`);
}

export function createBook(body: BookDto): Promise<BookDto> {
  return postJson<BookDto>('/books', body);
}

export function updateBook(id: number, body: BookDto): Promise<BookDto> {
  return putJson<BookDto>(`/books/${id}`, body);
}

export function deleteBook(id: number): Promise<void> {
  return deleteNoContent(`/books/${id}`);
}
