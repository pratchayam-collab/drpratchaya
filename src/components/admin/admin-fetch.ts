export function adminCsrf(): string {
  if (typeof window === 'undefined') return '';
  return (window as Window & { __ADMIN_CSRF__?: string }).__ADMIN_CSRF__ ?? '';
}

export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== 'GET' && init.method !== 'HEAD') {
    headers.set('X-Admin-CSRF', adminCsrf());
  }
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}
