/** @type {import('next').NextConfig} */
// On GitHub Project Pages the site is served under a sub-path (e.g. "/DentAce").
// Set NEXT_PUBLIC_BASE_PATH at export time so routes, _next bundles AND the
// asset() helper all resolve correctly. Empty (dev / local export) = served at root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  // `npm run export` sets EXPORT=1 → emit a fully static `out/` folder (no Node server).
  // Left off for `npm run dev`/`npm run build` so the dev experience is unconstrained.
  ...(process.env.EXPORT
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
        ...(basePath ? { basePath } : {}),
      }
    : {}),
};

export default nextConfig;
