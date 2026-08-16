/**
 * Resolve a header-safe display name without exposing a full email address.
 */
export function resolveDisplayName(name: string | null | undefined, email: string | null | undefined): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    const prefix = trimmedEmail.split('@')[0]?.trim();
    if (prefix) {
      return prefix;
    }
  }

  return 'Account';
}

/** First word of a display name for greetings (e.g. "Anar Safarli" → "Anar"). */
export function getGreetingName(displayName: string): string {
  const first = displayName.trim().split(/\s+/).filter(Boolean)[0];
  return first || 'there';
}

/**
 * Build a short initials label for the avatar (e.g. "E2E Admin" → "EA").
 */
export function getInitials(displayName: string): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}
