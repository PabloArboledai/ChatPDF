import { NextRequest } from "next/server";

const API_BASE = process.env.API_INTERNAL_BASE_URL || "http://api:8000";

function buildUrl(pathname: string, search: string): string {
  const p = pathname.replace(/^\/api\//, "/");
  return `${API_BASE}${p}${search || ""}`;
}

async function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const target = buildUrl(url.pathname, url.search);

  const headers = new Headers(req.headers);
  // Avoid leaking host/origin
  headers.delete("host");
  headers.delete("origin");

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const resp = await fetch(target, init);

  const respHeaders = new Headers(resp.headers);
  // Avoid CORS preflight issues since same-origin
  respHeaders.delete("access-control-allow-origin");

  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
