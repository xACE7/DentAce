/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `npm run export` sets EXPORT=1 → emit a fully static `out/` folder (no Node server).
  // Left off for `npm run dev`/`npm run build` so the dev experience is unconstrained.
  ...(process.env.EXPORT
    ? { output: "export", images: { unoptimized: true }, trailingSlash: true }
    : {}),
};

export default nextConfig;
