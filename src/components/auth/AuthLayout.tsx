import type { ReactNode } from 'react';
import './AuthLayout.css';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <p className="auth-brand__kicker">Staff access</p>
        <h1 className="auth-brand__title">Library Management</h1>
        <p className="auth-brand__copy">
          Sign in to manage the catalogue, membership records, and circulation for your
          branch. Accounts are issued through this application and authenticated against
          the Library Management API.
        </p>
      </aside>
      <section className="auth-panel">
        <div className="auth-panel__inner">
          <h2 className="auth-panel__title">{title}</h2>
          <p className="auth-panel__subtitle">{subtitle}</p>
          {children}
          <p className="auth-panel__footer">{footer}</p>
        </div>
      </section>
    </div>
  );
}
