import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { getNavItems } from '../components/layout/nav';
import { THEME_STORAGE_KEY } from '../theme/theme';
import { SettingsPage } from './SettingsPage';

const { changePassword, getUserProfile, updateUserProfile } = vi.hoisted(() => ({
  changePassword: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock('../api/auth', () => ({
  changePassword,
  login: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('../api/user', () => ({
  getUserProfile,
  updateUserProfile,
  borrowOwnBook: vi.fn(),
  getUserLoans: vi.fn(),
  returnOwnBook: vi.fn(),
}));

function renderSettingsPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-preference');
    getUserProfile.mockResolvedValue({
      name: 'Ali Safarli',
      email: 'user@library.com',
    });
    updateUserProfile.mockResolvedValue({
      name: 'Ali Updated',
      email: 'user@library.com',
    });
    changePassword.mockResolvedValue({ message: 'Password changed successfully.' });
  });

  it('is available to both USER and ADMIN in navigation', () => {
    expect(getNavItems('USER').map((item) => item.to)).toContain('/settings');
    expect(getNavItems('ADMIN').map((item) => item.to)).toContain('/settings');
  });

  it('loads the current profile and renders name and email', async () => {
    renderSettingsPage();

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Session' })).not.toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Access token expires/i)).not.toBeInTheDocument();

    expect(await screen.findByDisplayValue('Ali Safarli')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user@library.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly');
  });

  it('validates an empty name before saving', async () => {
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.clear(screen.getByLabelText('Full name'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Full name is required.')).toBeInTheDocument();
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it('saves a successful name update', async () => {
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.clear(screen.getByLabelText('Full name'));
    await user.type(screen.getByLabelText('Full name'), 'Ali Updated');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith({ name: 'Ali Updated' });
    });
    expect(await screen.findByText('Profile updated successfully.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ali Updated')).toBeInTheDocument();
  });

  it('shows an API error when profile update fails', async () => {
    updateUserProfile.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-17T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Unable to update profile right now',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.clear(screen.getByLabelText('Full name'));
    await user.type(screen.getByLabelText('Full name'), 'New Name');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to update profile right now');
    expect(screen.queryByText('Profile updated successfully.')).not.toBeInTheDocument();
  });

  it('selects Light, Dark, and System appearance and persists preference', async () => {
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.click(screen.getByRole('radio', { name: 'Light' }));
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await user.click(screen.getByRole('radio', { name: 'System' }));
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('restores the appearance preference after reload', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await user.click(screen.getByRole('radio', { name: 'Light' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('validates required password fields before submit', async () => {
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(screen.getByText('Current password is required.')).toBeInTheDocument();
    expect(screen.getByText('New password is required.')).toBeInTheDocument();
    expect(screen.getByText('Confirm your new password.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('rejects mismatched password confirmation', async () => {
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.type(screen.getByLabelText('Current password'), 'OldPass123');
    await user.type(screen.getByLabelText('New password'), 'NewPass456');
    await user.type(screen.getByLabelText('Confirm new password'), 'NewPass999');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('submits a successful password change and clears the fields', async () => {
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.type(screen.getByLabelText('Current password'), 'OldPass123');
    await user.type(screen.getByLabelText('New password'), 'NewPass456');
    await user.type(screen.getByLabelText('Confirm new password'), 'NewPass456');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
      });
    });
    expect(await screen.findByText('Password changed successfully.')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toHaveValue('');
    expect(screen.getByLabelText('New password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm new password')).toHaveValue('');
  });

  it('shows Changing... and disables fields while submitting', async () => {
    let resolveRequest: ((value: { message: string }) => void) | undefined;
    changePassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.type(screen.getByLabelText('Current password'), 'OldPass123');
    await user.type(screen.getByLabelText('New password'), 'NewPass456');
    await user.type(screen.getByLabelText('Confirm new password'), 'NewPass456');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(screen.getByRole('button', { name: 'Changing...' })).toBeDisabled();
    expect(screen.getByLabelText('Current password')).toBeDisabled();

    resolveRequest?.({ message: 'Password changed successfully.' });
    expect(await screen.findByText('Password changed successfully.')).toBeInTheDocument();
  });

  it('shows an API error when password change fails', async () => {
    changePassword.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-17T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Current password is incorrect',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderSettingsPage();
    await screen.findByDisplayValue('Ali Safarli');

    await user.type(screen.getByLabelText('Current password'), 'WrongPass');
    await user.type(screen.getByLabelText('New password'), 'NewPass456');
    await user.type(screen.getByLabelText('Confirm new password'), 'NewPass456');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect');
    expect(screen.queryByText('Password changed successfully.')).not.toBeInTheDocument();
  });
});
