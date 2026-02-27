// Read CSRF token from cookie
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Fetch a fresh CSRF token from the backend (sets the cookie)
async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfTokenFromCookie();
  if (token) return token;

  // No cookie yet — request one
  await fetch('/api/csrf-token', { credentials: 'include' });
  token = getCsrfTokenFromCookie();
  return token;
}

// Helper to make authenticated API calls
export async function apiFetch(url: string, options: RequestInit = {}) {
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('boss_token') : null;

  // For state-changing methods, include CSRF token
  const method = (options.method || 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (needsCsrf) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('boss_token');
      window.location.reload();
    }
  }

  return response;
}
