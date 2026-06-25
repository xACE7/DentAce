import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Chrome } from "@/components/chrome/Chrome";
import { PresenceTracker } from "@/components/chrome/PresenceTracker";
import { BanGate } from "@/components/chrome/BanGate";
import { ChalkFilters } from "@/components/chrome/ChalkFilters";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { ToTop } from "@/components/chrome/ToTop";
import { OfflineBar } from "@/components/chrome/OfflineBar";
import { PwaRegister } from "@/components/chrome/PwaRegister";
import { GA_ID } from "@/lib/site-config";

/* No-flash boot: set data-theme/design/mode/lang + read-scale BEFORE first paint,
   straight from localStorage — identical to the old site's inline <head> script. */
const BOOT = `(function(){try{var e=document.documentElement,g=localStorage,t=g.getItem('dentace-theme')||'ace';if(!/^(ace|forest|royal|mono|daylight|pearl|sakura|mint)$/.test(t))t='ace';e.setAttribute('data-theme',t);e.setAttribute('data-mode',g.getItem('dentace-mode')==='light'?'light':'dark');var d=g.getItem('dentace-design')||'paper';if(d==='chalk')d='paper';e.setAttribute('data-design',d);var s=g.getItem('dentace-read-scale');if(s)e.style.setProperty('--read-scale',s+'rem');var l=g.getItem('dentace-lang')==='ar'?'ar':'en';e.setAttribute('data-lang',l);}catch(x){}})();`;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Gochi+Hand&family=Inter:wght@400;600;800;900&family=Kalam:wght@400;700&family=Permanent+Marker&display=swap";

const DESC = "Bilingual dentistry study guide — interactive lectures & tests.";

// Deploy sub-path (e.g. "/DentAce" on GitHub Project Pages). Raw <link>/icon/og
// paths in metadata are NOT auto-prefixed by Next, so prepend it ourselves.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  // resolves relative og/icon URLs to absolute (needed for link previews).
  // On deploy, set SITE_URL to your real domain so shared links show the preview image.
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "DentAce", template: "%s — DentAce" },
  description: DESC,
  applicationName: "DentAce",
  manifest: `${BASE}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${BASE}/icon.svg`, type: "image/svg+xml" },
      { url: `${BASE}/favicon.png`, type: "image/png", sizes: "64x64" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "DentAce",
    title: "DentAce",
    description: DESC,
    images: [{ url: `${BASE}/og.png?v=2`, width: 1200, height: 630, alt: "DentAce" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DentAce",
    description: DESC,
    images: [`${BASE}/og.png?v=2`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#16181b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
        {GA_ID ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
              }}
            />
          </>
        ) : null}
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <PresenceTracker />
            <BanGate />
            <Chrome />
            {children}
            <SiteFooter />
            <ToTop />
            <OfflineBar />
            <ChalkFilters />
            <PwaRegister />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
