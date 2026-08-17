import type { AuthorDto, Page, PageQuery } from '../types/api';
import { deleteNoContent, getJson, postJson, putJson } from './http';

export function listAuthors(query: PageQuery = {}): Promise<Page<AuthorDto>> {
  return getJson<Page<AuthorDto>>('/authors', query);
}

export function searchAuthors(
  query: PageQuery & { q?: string; hasBooks?: boolean } = {},
): Promise<Page<AuthorDto>> {
  return getJson<Page<AuthorDto>>('/authors/search', query);
}

export function getAuthor(id: number): Promise<AuthorDto> {
  return getJson<AuthorDto>(`/authors/${id}`);
}

export function createAuthor(body: AuthorDto): Promise<AuthorDto> {
  return postJson<AuthorDto>('/authors', body);
}

export function updateAuthor(id: number, body: AuthorDto): Promise<AuthorDto> {
  return putJson<AuthorDto>(`/authors/${id}`, body);
}

export function deleteAuthor(id: number): Promise<void> {
  return deleteNoContent(`/authors/${id}`);
}
