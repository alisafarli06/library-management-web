import type { MemberDto, Page, PageQuery } from '../types/api';
import { deleteNoContent, getJson, postJson, postNoContent, putJson } from './http';

export function listMembers(query: PageQuery = {}): Promise<Page<MemberDto>> {
  return getJson<Page<MemberDto>>('/members', query);
}

export function getMember(id: number): Promise<MemberDto> {
  return getJson<MemberDto>(`/members/${id}`);
}

export function createMember(body: MemberDto): Promise<MemberDto> {
  return postJson<MemberDto>('/members', body);
}

export function updateMember(id: number, body: MemberDto): Promise<MemberDto> {
  return putJson<MemberDto>(`/members/${id}`, body);
}

export function deleteMember(id: number): Promise<void> {
  return deleteNoContent(`/members/${id}`);
}

export function borrowBook(memberId: number, bookId: number): Promise<void> {
  return postNoContent(`/members/${memberId}/books/${bookId}/borrow`);
}
