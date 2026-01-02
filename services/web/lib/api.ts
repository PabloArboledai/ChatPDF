// Client-side: always use same-origin proxy (/api/*)
export function clientApi(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `/api${p}`;
}

// Server-side: the Next server can call the API via internal network
export function serverApiBaseUrl(): string {
  return process.env.API_INTERNAL_BASE_URL || "http://localhost:8000";
}
