import React from "react";
import { chalkify } from "@/lib/theme/chalkify";

/* Mirror of render.js inline(): converts the flat inline markup
   [imp][exam][extra][def][mic][b][u][br] and [r]…[/r] into React nodes,
   chalkifying plain-text segments (emoji→chalk SVG) when `active`. */

const SPAN: Record<string, string> = { imp: "imp", exam: "exam", extra: "extra", def: "def", mic: "mic" };
const TAG = /\[(imp|exam|extra|def|mic|b|u|r)\]([\s\S]*?)\[\/\1\]/g;

function text(s: string, active: boolean, key: string): React.ReactNode {
  if (s.indexOf("[br]") === -1) return chalkify(s, active);
  const parts = s.split("[br]");
  const out: React.ReactNode[] = [];
  parts.forEach((p, i) => {
    if (i) out.push(<br key={`${key}-br${i}`} />);
    out.push(<React.Fragment key={`${key}-t${i}`}>{chalkify(p, active)}</React.Fragment>);
  });
  return out;
}

export function renderInline(input: string | null | undefined, active: boolean): React.ReactNode {
  const s = input == null ? "" : String(input);
  if (s.indexOf("[") === -1) return chalkify(s, active);
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(s))) {
    if (m.index > last) out.push(<React.Fragment key={`p${i}`}>{text(s.slice(last, m.index), active, `p${i}`)}</React.Fragment>);
    const tag = m[1];
    const inner = m[2];
    const k = `t${i++}`;
    if (tag === "b") out.push(<b key={k}>{text(inner, active, k)}</b>);
    else if (tag === "u") out.push(<u key={k}>{text(inner, active, k)}</u>);
    else if (tag === "r")
      out.push(
        <span key={k} className="recall">
          <span className="ans">{text(inner, active, k)}</span>
        </span>
      );
    else out.push(<span key={k} className={SPAN[tag]}>{text(inner, active, k)}</span>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(<React.Fragment key={`end`}>{text(s.slice(last), active, "end")}</React.Fragment>);
  return out;
}
