// Pure helpers for telling "the server said no" apart from "we couldn't reach the
// server". They matter most with a hosted backend that sleeps when idle: the first
// request after a quiet period can take up to a minute, and that must never look
// like a wrong password or log the person out.

export function isNetworkError(e: any): boolean {
  if (!e || e.response) return false; // the server answered, so it is reachable
  return e.code === 'ECONNABORTED' || e.code === 'ERR_NETWORK' || e.message === 'Network Error' || /timeout/i.test(String(e.message ?? ''));
}

export function isTimeout(e: any): boolean {
  return !!e && !e.response && (e.code === 'ECONNABORTED' || /timeout/i.test(String(e.message ?? '')));
}

// The message to show a person. The server's own message wins; otherwise a
// connection problem says so instead of pretending the credentials were wrong.
export function describeApiError(e: any, fallback: string): string {
  const m = e?.response?.data?.message;
  if (m) return Array.isArray(m) ? m.join(', ') : String(m);
  if (isTimeout(e)) return 'The server is taking a while to respond — it may be waking up. Please try again in a moment.';
  if (isNetworkError(e)) return "Can't reach the server. Check your internet connection and try again.";
  return fallback;
}

// A request that failed only because the server was slow or asleep is tried once
// more. Only requests that are safe to repeat: reads, and sign-in / token refresh.
export function shouldRetryOnce(config: { method?: string; url?: string; _networkRetried?: boolean } | undefined, error: any): boolean {
  if (!config || config._networkRetried || !isNetworkError(error)) return false;
  const method = (config.method ?? 'get').toLowerCase();
  const url = config.url ?? '';
  return method === 'get' || url.endsWith('/auth/login') || url.endsWith('/auth/refresh');
}

// Did the server actually refuse the refresh token (the session is over), or did
// the refresh just fail to arrive (keep the session and try again later)?
export function isDefinitiveAuthRejection(error: any): boolean {
  const status = error?.response?.status;
  return status === 400 || status === 401 || status === 403;
}
