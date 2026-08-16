import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordField } from '../components/auth/PasswordField';
import { TextField } from '../components/auth/TextField';
import { errorMessage, fieldErrorsFrom, isValidEmail } from '../components/auth/formErrors';
import { EnvelopeIcon, UserIcon } from '../components/auth/icons';

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      nextErrors.fullName = 'Full name is required.';
    }
    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (password.length > 72) {
      nextErrors.password = 'Password must be at most 72 characters.';
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
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
      await register({
        fullName: trimmedName,
        email: trimmedEmail,
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const backendFields = fieldErrorsFrom(error);
      setFieldErrors(backendFields);
      setFormError(
        Object.keys(backendFields).length === 0
          ? errorMessage(error, 'Unable to create the account. Try again.')
          : null,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="New accounts are issued as USER and sign you in immediately."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
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
          id="register-full-name"
          label="Full name"
          name="fullName"
          autoComplete="name"
          icon={<UserIcon />}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={fieldErrors.fullName}
          disabled={submitting}
        />
        <TextField
          id="register-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          icon={<EnvelopeIcon />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={submitting}
        />
        <PasswordField
          id="register-password"
          label="Password"
          name="password"
          autoComplete="new-password"
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={submitting}
        />
        <PasswordField
          id="register-confirm-password"
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          maxLength={72}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors.confirmPassword}
          disabled={submitting}
        />
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
