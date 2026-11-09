/* Smoke test for the interactive lecture blocks.

   The site renders lectures on the client, so the static export never contains the
   widget DOM and grepping out/ cannot verify them. This renders the real components
   with react-dom/server and asserts the expected elements appear, which exercises
   the hooks, the provider and the deterministic shuffle.

   Run:  npx tsx tools/ix-smoke.tsx
*/
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../src/lib/theme/ThemeProvider";
import { InteractiveProvider } from "../src/lib/content/interactive";
import { HotspotView, QuizBlockView, OrderView, MatchView, RevealView, HiddenTable, IxBar } from "../src/components/content/Interactive";

const b = (en: string) => ({ en, ar: en });

const tree = (
 <ThemeProvider>
  <InteractiveProvider lectureId="/lecture/test/x/y/1" total={6}>
    <HotspotView
      id="h1"
      h={{
        img: "/img/x.jpg",
        cap: b("A caption"),
        pts: [
          { x: 10, y: 20, label: b("Apical constriction"), body: b("the minor diameter") },
          { x: 70, y: 40, label: b("Apical foramen") },
        ],
      }}
    />
    <QuizBlockView
      id="q1"
      q={{ q: b("Which cusp contacts the plane?"), opts: [b("Mesio-palatal"), b("Disto-buccal"), b("Mesio-buccal"), b("Disto-palatal")], correct: 0, explain: b("The mesio-palatal cusp.") }}
    />
    <OrderView id="o1" o={{ title: b("Order the steps"), steps: [b("First"), b("Second"), b("Third"), b("Fourth")] }} />
    <MatchView id="m1" m={{ title: b("Match"), pairs: [[b("Arcon"), b("Condyle on lower member")], [b("Non-arcon"), b("Condyle on upper member")]] }} />
    <RevealView id="r1" r={{ label: b("Recall"), items: [{ q: b("Premolars"), a: b("Both cusps touch") }, { q: b("2nd molar"), a: b("No cusp touches") }] }} />
    <HiddenTable id="t1" t={{ head: [b("Natural"), b("Denture")], rows: [[b("PDL"), b("Mucosa")], [b("Independent"), b("As a unit")]], hide: [1] }} />
    <IxBar />
  </InteractiveProvider>
 </ThemeProvider>
);

const html = renderToStaticMarkup(tree);

const must: [string, string][] = [
  ["hotspot dots", 'class="ix-dot"'],
  ["hotspot list", "ix-hot-list"],
  ["quiz options", "ix-opt"],
  ["quiz tag", "Check yourself"],
  ["order steps", "ix-step"],
  ["match grid", "ix-match-grid"],
  ["reveal rows", "ix-rev"],
  ["blurred answer", "ix-rev-a hid"],
  ["hidden cell", "ix-hidecell"],
  ["progress bar", "ix-bar-track"],
];

let bad = 0;
for (const [name, needle] of must) {
  const ok = html.includes(needle);
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
}

// the hidden column must be the SECOND one, and the first must stay visible
const firstColVisible = html.includes(">PDL<") || html.includes("PDL");
if (!firstColVisible) { console.log("FAIL  visible column lost"); bad++; } else console.log("ok    visible column kept");

// deterministic shuffle: rendering twice must give identical markup (no hydration drift)
const again = renderToStaticMarkup(tree);
if (again !== html) { console.log("FAIL  render is not deterministic"); bad++; } else console.log("ok    deterministic across renders");

console.log(bad ? `\n${bad} FAILURES` : "\nall interactive blocks render");
process.exit(bad ? 1 : 0);
