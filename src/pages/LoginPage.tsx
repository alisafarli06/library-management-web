import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordField } from '../components/auth/PasswordField';
import { TextField } from '../components/auth/TextField';
import { errorMessage, fieldErrorsFrom, isValidEmail } from '../components/auth/formErrors';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await login({ email: trimmedEmail, password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const backendFields = fieldErrorsFrom(error);
      setFieldErrors(backendFields);
      if (Object.keys(backendFields).length === 0) {
        setFormError(errorMessage(error, 'Unable to sign in. Check your details and try again.'));
      } else {
        setFormError(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use the email and password for your library account."
      footer={
        <>
          Need an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        {formError ? (
          <p className="form-alert" role="alert">
            {formError}
          </p>
        ) : null}
        <TextField
          id="login-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={submitting}
        />
        <PasswordField
          id="login-password"
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={submitting}
        />
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
