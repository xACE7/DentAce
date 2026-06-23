import React from "react";
import { CHALK_ICONS, CHALK_ALT } from "./chalkIcons";

/* Turn a string into React nodes, swapping known emojis for chalk SVGs when `active`.
   `active` = (mounted && design === "paper"); when false returns the raw string so
   SSR/first-paint matches and there is no hydration mismatch. */
export function chalkify(text: string, active: boolean): React.ReactNode {
  if (!active || !text) return text;
  if (!new RegExp(CHALK_ALT).test(text)) return text; // no candidate emoji → raw string
  const re = new RegExp(CHALK_ALT, "g");
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={`ic-${i++}`} className="dchalk-ic" aria-hidden="true" data-emoji={m[1]}>
        <svg viewBox="0 0 28 28" dangerouslySetInnerHTML={{ __html: CHALK_ICONS[m[1]] }} />
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}
