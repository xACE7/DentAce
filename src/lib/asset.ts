/* Prefix absolute public-asset paths (images, icons) with the deploy basePath —
   e.g. "/DentAce" on GitHub Project Pages, served at xace7.github.io/DentAce/.
   Next.js applies basePath to <Link> routes and _next bundles automatically, but
   NOT to raw <img src> / <link href> that point at files in public/. Use asset()
   for those. Empty basePath (dev / local export) leaves paths untouched. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function asset(path: string): string {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) return path; // external / data URI
  return BASE_PATH + (path.startsWith("/") ? path : "/" + path);
}
