/* Nav-page stylesheet chain — imported DIRECTLY (not via CSS @import) so Turbopack bundles
   and hot-reloads every file. Order = the old style.css → theme.css cascade, flattened. */
import "@/styles/paper.css";
import "@/styles/chrome.css";
import "@/styles/nav/tokens.css";
import "@/styles/nav/buttons.css";
import "@/styles/nav/content-legacy.css";
import "@/styles/nav/header.css";
import "@/styles/nav/pages.css";
import "@/styles/nav/modes.css";
import "@/styles/nav/tools.css";
import "@/styles/nav/header-overrides.css";
import "@/styles/nav/sizes.css";
import "@/styles/nav/base.css";
import "@/styles/nav/layout.css";
import "@/styles/nav/bar.css";
import "@/styles/nav/card.css";
import "@/styles/nav/misc.css";
import "@/styles/nav/responsive.css";
import "@/styles/nav/list.css";
import "@/styles/themes.css";
import { SkipLink } from "@/components/chrome/SkipLink";

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      {children}
    </>
  );
}
