import type {
  AuthenticationResponse,
  ChangePasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
} from '../types/api';
import { saveAuthentication } from '../auth/session';
import { postJson } from './http';

export async function register(body: RegisterRequest): Promise<AuthenticationResponse> {
  const response = await postJson<AuthenticationResponse>('/auth/register', body, true);
  saveAuthentication(response);
  return response;
}

export async function login(body: LoginRequest): Promise<AuthenticationResponse> {
  const response = await postJson<AuthenticationResponse>('/auth/login', body, true);
  saveAuthentication(response);
  return response;
}

export async function refresh(refreshToken: string): Promise<AuthenticationResponse> {
  const response = await postJson<AuthenticationResponse>(
    '/auth/refresh',
    { refreshToken },
    true,
  );
  saveAuthentication(response);
  return response;
}

export function changePassword(body: ChangePasswordRequest): Promise<MessageResponse> {
  return postJson<MessageResponse>('/auth/change-password', body);
}
