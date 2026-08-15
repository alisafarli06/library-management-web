import { Navigate, Outlet } from 'react-router-dom';
import { hasValidAccessSession } from '../auth/session';

export function RequireAuth() {
  if (!hasValidAccessSession()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function GuestOnly() {
  if (hasValidAccessSession()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
