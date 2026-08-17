import { useEffect, useState, type FormEvent } from 'react';
import { changePassword } from '../api/auth';
import { getUserProfile, updateUserProfile } from '../api/user';
import { PasswordField } from '../components/auth/PasswordField';
import { TextField } from '../components/auth/TextField';
import { errorMessage, fieldErrorsFrom } from '../components/auth/formErrors';
import '../components/auth/AuthLayout.css';
import { Button, Card, PageHeader } from '../components/ui/Primitives';
import { useThemePreference } from '../theme/useThemePreference';
import type { ThemePreference } from '../theme/theme';
import './SettingsPage.css';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function SettingsPage() {
  const { preference, setPreference } = useThemePreference();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileLoadError(null);
      try {
        const profile = await getUserProfile();
        if (cancelled) {
          return;
        }
        setName(profile.name ?? '');
        setEmail(profile.email ?? '');
      } catch (error) {
        if (!cancelled) {
          setProfileLoadError(errorMessage(error, 'Unable to load your profile.'));
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  function validateProfileName(value: string): string | null {
    if (!value.trim()) {
      return 'Full name is required.';
    }
    return null;
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profileSaving) {
      return;
    }

    const nameError = validateProfileName(name);
    if (nameError) {
      setProfileFieldErrors({ name: nameError });
      setProfileFormError(null);
      setProfileSuccess(null);
      return;
    }

    setProfileSaving(true);
    setProfileFieldErrors({});
    setProfileFormError(null);
    setProfileSuccess(null);

    try {
      const updated = await updateUserProfile({ name: name.trim() });
      setName(updated.name);
      setEmail(updated.email);
      setProfileSuccess('Profile updated successfully.');
    } catch (error) {
      const backendFields = fieldErrorsFrom(error);
      const mapped: Record<string, string> = {};
      if (backendFields.name) {
        mapped.name = backendFields.name;
      }
      setProfileFieldErrors(mapped);
      if (Object.keys(mapped).length === 0) {
        setProfileFormError(errorMessage(error, 'Unable to update profile. Please try again.'));
      }
    } finally {
      setProfileSaving(false);
    }
  }

  function validatePasswordFields(
    values: { currentPassword: string; newPassword: string; confirmPassword: string },
    options: { requireCurrent?: boolean } = {},
  ): Record<string, string> {
    const { requireCurrent = true } = options;
    const nextErrors: Record<string, string> = {};

    if (requireCurrent && !values.currentPassword) {
      nextErrors.currentPassword = 'Current password is required.';
    }

    if (!values.newPassword) {
      nextErrors.newPassword = 'New password is required.';
    } else if (values.newPassword.length < PASSWORD_MIN) {
      nextErrors.newPassword = 'New password must be at least 8 characters.';
    } else if (values.newPassword.length > PASSWORD_MAX) {
      nextErrors.newPassword = `New password must be at most ${PASSWORD_MAX} characters.`;
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your new password.';
    } else if (values.newPassword && values.confirmPassword !== values.newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordSubmitting) {
      return;
    }

    const nextErrors = validatePasswordFields({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (Object.keys(nextErrors).length > 0) {
      setPasswordFieldErrors(nextErrors);
      setPasswordFormError(null);
      setPasswordSuccess(null);
      return;
    }

    setPasswordSubmitting(true);
    setPasswordFieldErrors({});
    setPasswordFormError(null);
    setPasswordSuccess(null);

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(response.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const backendFields = fieldErrorsFrom(error);
      const mapped: Record<string, string> = {};
      if (backendFields.currentPassword) {
        mapped.currentPassword = backendFields.currentPassword;
      }
      if (backendFields.newPassword) {
        mapped.newPassword = backendFields.newPassword;
      }
      setPasswordFieldErrors(mapped);
      if (Object.keys(mapped).length === 0) {
        setPasswordFormError(errorMessage(error, 'Unable to change password. Check your details and try again.'));
      }
    } finally {
      setPasswordSubmitting(false);
    }
  }

  function showInlinePasswordErrors(next: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }) {
    const values = {
      currentPassword: next.currentPassword ?? currentPassword,
      newPassword: next.newPassword ?? newPassword,
      confirmPassword: next.confirmPassword ?? confirmPassword,
    };
    const errors = validatePasswordFields(values, { requireCurrent: false });
    setPasswordFieldErrors((current) => {
      const merged = { ...current };
      if (next.newPassword !== undefined) {
        if (errors.newPassword) {
          merged.newPassword = errors.newPassword;
        } else {
          delete merged.newPassword;
        }
      }
      if (next.confirmPassword !== undefined || next.newPassword !== undefined) {
        if (errors.confirmPassword) {
          merged.confirmPassword = errors.confirmPassword;
        } else {
          delete merged.confirmPassword;
        }
      }
      return merged;
    });
  }

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, and application preferences."
      />

      <div className="settings-grid">
        <section className="settings-section" aria-labelledby="settings-profile-heading">
          <Card className="settings-card">
            <div className="settings-card__header">
              <h2 id="settings-profile-heading" className="settings-section__title">
                Profile
              </h2>
              <p className="settings-card__intro">Update the name shown on your library account.</p>
            </div>

            {profileLoadError ? (
              <p className="form-alert" role="alert">
                {profileLoadError}
              </p>
            ) : null}

            <form
              className="settings-form auth-form"
              onSubmit={handleSaveProfile}
              noValidate
              aria-busy={profileSaving || profileLoading}
            >
              {profileSuccess ? (
                <p className="settings-success" role="status">
                  {profileSuccess}
                </p>
              ) : null}
              {profileFormError ? (
                <p className="form-alert" role="alert">
                  {profileFormError}
                </p>
              ) : null}

              <TextField
                id="settings-full-name"
                label="Full name"
                name="name"
                autoComplete="name"
                value={name}
                disabled={profileSaving || profileLoading}
                error={profileFieldErrors.name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (profileFieldErrors.name) {
                    setProfileFieldErrors((current) => {
                      const next = { ...current };
                      delete next.name;
                      return next;
                    });
                  }
                }}
              />

              <TextField
                id="settings-email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                readOnly
                disabled
                aria-readonly="true"
                aria-describedby="settings-email-hint"
              />
              <p id="settings-email-hint" className="settings-field-hint">
                Your email is used to sign in and cannot be changed here.
              </p>

              <div className="settings-form__actions">
                <Button type="submit" disabled={profileSaving || profileLoading || Boolean(profileLoadError)}>
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="settings-section" aria-labelledby="settings-appearance-heading">
          <Card className="settings-card">
            <div className="settings-card__header">
              <h2 id="settings-appearance-heading" className="settings-section__title">
                Appearance
              </h2>
              <p className="settings-card__intro">Choose how Library Management looks.</p>
            </div>

            <div
              className="settings-theme"
              role="radiogroup"
              aria-labelledby="settings-appearance-heading"
            >
              {THEME_OPTIONS.map((option) => {
                const selected = preference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={['settings-theme__option', selected ? 'is-selected' : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setPreference(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </section>
      </div>

      <section className="settings-section settings-section--security" aria-labelledby="settings-security-heading">
        <Card className="settings-card">
          <div className="settings-card__header">
            <h2 id="settings-security-heading" className="settings-section__title">
              Security
            </h2>
            <p className="settings-card__intro">
              Change your account password. Use at least {PASSWORD_MIN} characters.
            </p>
          </div>

          <form
            className="settings-form auth-form"
            onSubmit={handleChangePassword}
            noValidate
            aria-busy={passwordSubmitting}
          >
            {passwordSuccess ? (
              <p className="settings-success" role="status">
                {passwordSuccess}
              </p>
            ) : null}
            {passwordFormError ? (
              <p className="form-alert" role="alert">
                {passwordFormError}
              </p>
            ) : null}
            <PasswordField
              id="settings-current-password"
              label="Current password"
              name="currentPassword"
              autoComplete="current-password"
              value={currentPassword}
              disabled={passwordSubmitting}
              error={passwordFieldErrors.currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <PasswordField
              id="settings-new-password"
              label="New password"
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              disabled={passwordSubmitting}
              error={passwordFieldErrors.newPassword}
              onChange={(event) => {
                const value = event.target.value;
                setNewPassword(value);
                showInlinePasswordErrors({ newPassword: value });
              }}
              onBlur={() => showInlinePasswordErrors({ newPassword })}
            />
            <PasswordField
              id="settings-confirm-password"
              label="Confirm new password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              disabled={passwordSubmitting}
              error={passwordFieldErrors.confirmPassword}
              onChange={(event) => {
                const value = event.target.value;
                setConfirmPassword(value);
                showInlinePasswordErrors({ confirmPassword: value });
              }}
              onBlur={() => showInlinePasswordErrors({ confirmPassword })}
            />
            <div className="settings-form__actions">
              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? 'Changing...' : 'Change password'}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
