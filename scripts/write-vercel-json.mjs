import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const origin = (process.env.VITE_API_ORIGIN || '').trim().replace(/\/+$/, '');
const isLocalOrigin = !origin || /localhost|127\.0\.0\.1/i.test(origin);

const rewrites = [];

if (!isLocalOrigin) {
  if (!/^https?:\/\//i.test(origin)) {
    throw new Error(`VITE_API_ORIGIN must be an absolute URL, received: ${origin}`);
  }

  rewrites.push({
    source: '/api/:path*',
    destination: `${origin}/api/:path*`,
  });
} else if (process.env.VERCEL) {
  throw new Error(
    'VITE_API_ORIGIN must be set in Vercel Environment Variables to the deployed API origin (e.g. https://your-api.onrender.com, no trailing slash).',
  );
}

rewrites.push({
  source: '/(.*)',
  destination: '/index.html',
});

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'vercel.json');
writeFileSync(outPath, `${JSON.stringify({ rewrites }, null, 2)}\n`);
console.log(
  isLocalOrigin
    ? 'Wrote vercel.json SPA fallback (no API proxy; VITE_API_ORIGIN is local or unset).'
    : `Wrote vercel.json API proxy to ${origin}`,
);
