/**
 * Vite's /api proxy target for `npm run dev`.
 *
 * `VITE_API_ORIGIN` is often the production Render URL (used by `vite build`).
 * Using that as the dev proxy target sends browser Origin http://localhost:5173
 * to production, where CORS only allows the Vercel origin.
 */
export function resolveDevApiProxyTarget(viteApiOrigin: string | undefined): string {
  const origin = viteApiOrigin?.trim().replace(/\/+$/, '') || 'http://localhost:8080';
  try {
    const hostname = new URL(origin).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return origin;
    }
  } catch {
    return 'http://localhost:8080';
  }
  return 'http://localhost:8080';
}
