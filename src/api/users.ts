import type { AdminUserDto, Role } from '../types/api';
import { patchJson } from './http';

export function updateUserRole(id: number, role: Role): Promise<AdminUserDto> {
  return patchJson<AdminUserDto>(`/admin/users/${id}/role`, { role });
}

export function updateUserStatus(id: number, blocked: boolean): Promise<AdminUserDto> {
  return patchJson<AdminUserDto>(`/admin/users/${id}/status`, { blocked });
}
