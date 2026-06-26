/** @type {import('next').NextConfig} */

// In production the web (Vercel) and API (Railway) are on different domains, so a
// cross-site httpOnly cookie can't be read by the Next middleware. Proxying /api
// through this origin keeps the auth cookie first-party.
//
// The proxy target is taken from API_PROXY_TARGET (set it to the API origin in
// production) — not hardcoded, so the backend host isn't baked into source. In
// dev the proxy is off (the client talks to the local API via NEXT_PUBLIC_API_URL).
const isProd = process.env.NODE_ENV === 'production';
const apiTarget = process.env.API_PROXY_TARGET;

if (isProd && !apiTarget) {
  console.warn('[next.config] API_PROXY_TARGET is not set — /api requests will not be proxied.');
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@entrio/types'],
  async rewrites() {
    return isProd && apiTarget
      ? [{ source: '/api/:path*', destination: `${apiTarget}/api/:path*` }]
      : [];
  },
};

export default nextConfig;
