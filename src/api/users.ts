import type { AdminUserDto, Page, PageQuery, Role } from '../types/api';
import { deleteNoContent, getJson, patchJson } from './http';

export function searchUsers(
  query: PageQuery & { q?: string; role?: Role } = {},
): Promise<Page<AdminUserDto>> {
  return getJson<Page<AdminUserDto>>('/admin/users', query);
}

export function getAdminUser(id: number): Promise<AdminUserDto> {
  return getJson<AdminUserDto>(`/admin/users/${id}`);
}

export function updateUserRole(id: number, role: Role): Promise<AdminUserDto> {
  return patchJson<AdminUserDto>(`/admin/users/${id}/role`, { role });
}

export function deleteUser(id: number): Promise<void> {
  return deleteNoContent(`/admin/users/${id}`);
}
