import { getText } from './http';

export function getUserProfile(): Promise<string> {
  return getText('/user/profile');
}
