export const INTERNAL_AUTH_DOMAIN = import.meta.env.VITE_INTERNAL_AUTH_DOMAIN || 'ugnas.internal';

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
}

export function usernameToEmail(username: string) {
  const normalized = normalizeUsername(username);
  return `${normalized}@${INTERNAL_AUTH_DOMAIN}`;
}

export function emailToUsername(email: string | null | undefined) {
  const value = (email ?? '').toLowerCase();
  const suffix = `@${INTERNAL_AUTH_DOMAIN.toLowerCase()}`;
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

export function parseAdminUsernames(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map(normalizeUsername)
    .filter(Boolean);
}
