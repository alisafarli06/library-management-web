import { Navigate, Route, Routes } from 'react-router-dom';
import { InactivityTimeoutListener } from './components/auth/InactivityTimeoutListener';
import { SessionExpiryListener } from './components/auth/SessionExpiryListener';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { AuthorsPage } from './pages/AuthorsPage';
import { MembersPage } from './pages/MembersPage';
import { MyLoansPage } from './pages/MyLoansPage';
import { AdminLoansPage } from './pages/AdminLoansPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppLayout } from './components/layout/AppLayout';
import { GuestOnly, RequireAdmin, RequireAuth } from './routes/guards';
import { hasValidAccessSession } from './auth/session';

function FallbackRedirect() {
  return <Navigate to={hasValidAccessSession() ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <>
      <SessionExpiryListener />
      <InactivityTimeoutListener />
      <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/my-loans" element={<MyLoansPage />} />
          <Route path="/authors" element={<AuthorsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/loans" element={<AdminLoansPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/members" element={<MembersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<FallbackRedirect />} />
      </Routes>
    </>
  );
}
