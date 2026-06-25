/** @type {import('next').NextConfig} */

// In production the web (Vercel) and API (Railway) are on different domains, so a
// cross-site httpOnly cookie can't be read by the Next middleware. Proxying /api
// through this origin keeps the auth cookie first-party.
//
// The proxy is enabled in production builds and defaults to the Railway backend;
// override the target with API_PROXY_TARGET. In dev it's off (the client talks to
// the local API directly via NEXT_PUBLIC_API_URL).
const isProd = process.env.NODE_ENV === 'production';
const apiTarget = process.env.API_PROXY_TARGET ?? 'https://entrio-production.up.railway.app';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@entrio/types'],
  async rewrites() {
    return isProd ? [{ source: '/api/:path*', destination: `${apiTarget}/api/:path*` }] : [];
  },
};

export default nextConfig;
