import type { ReactNode } from 'react';
import { BookshelfMark, CheckIcon } from './icons';
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
        <div className="auth-brand__inner">
          <div className="auth-brand__mark-wrap">
            <span className="auth-brand__glow" aria-hidden="true" />
            <BookshelfMark />
          </div>
          <p className="auth-brand__kicker">Library platform</p>
          <h1 className="auth-brand__title">Library Management</h1>
          <p className="auth-brand__copy">One place for your catalogue, members, and lending.</p>
          <ul className="auth-brand__features">
            <li>
              <CheckIcon />
              Catalogue
            </li>
            <li>
              <CheckIcon />
              Members
            </li>
            <li>
              <CheckIcon />
              Lending
            </li>
          </ul>
        </div>
      </aside>
      <section className="auth-panel">
        <div className="auth-panel__card">
          <header className="auth-panel__header">
            <h2 className="auth-panel__title">{title}</h2>
            <p className="auth-panel__subtitle">{subtitle}</p>
          </header>
          {children}
          <p className="auth-panel__footer">{footer}</p>
        </div>
      </section>
    </div>
  );
}
