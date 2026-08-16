import type { BookDto, BookSearchQuery, Page, PageQuery } from '../types/api';
import { deleteJson, deleteNoContent, getJson, postForm, postJson, putJson } from './http';

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

export function attachBookCover(bookId: number, file: File): Promise<BookDto> {
  const formData = new FormData();
  formData.append('file', file);
  return postForm<BookDto>(`/books/${bookId}/cover`, formData);
}

export function attachBookPreface(bookId: number, file: File): Promise<BookDto> {
  const formData = new FormData();
  formData.append('file', file);
  return postForm<BookDto>(`/books/${bookId}/preface`, formData);
}

export function removeBookCover(bookId: number): Promise<BookDto> {
  return deleteJson<BookDto>(`/books/${bookId}/cover`);
}

export function removeBookPreface(bookId: number): Promise<BookDto> {
  return deleteJson<BookDto>(`/books/${bookId}/preface`);
}
