import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { AuthorsPage } from './pages/AuthorsPage';
import { MembersPage } from './pages/MembersPage';
import { FilesPage } from './pages/FilesPage';
import { MyLoansPage } from './pages/MyLoansPage';
import { AdminLoansPage } from './pages/AdminLoansPage';
import { AppLayout } from './components/layout/AppLayout';
import { GuestOnly, RequireAdmin, RequireAuth } from './routes/guards';

export default function App() {
  return (
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
          <Route element={<RequireAdmin />}>
            <Route path="/loans" element={<AdminLoansPage />} />
            <Route path="/members" element={<MembersPage />} />
          </Route>
          <Route path="/files" element={<FilesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
