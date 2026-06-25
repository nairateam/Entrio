/** @type {import('next').NextConfig} */

// In production the web (Vercel) and API (Railway) are on different domains, so a
// cross-site httpOnly cookie can't be read by the Next middleware. Proxying /api
// through this origin keeps the auth cookie first-party. Set API_PROXY_TARGET to
// the backend URL (e.g. https://entrio-production.up.railway.app) on Vercel, and
// set NEXT_PUBLIC_API_URL="" so the client calls the same-origin /api path.
const apiTarget = process.env.API_PROXY_TARGET;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@entrio/types'],
  async rewrites() {
    return apiTarget
      ? [{ source: '/api/:path*', destination: `${apiTarget}/api/:path*` }]
      : [];
  },
};

export default nextConfig;
