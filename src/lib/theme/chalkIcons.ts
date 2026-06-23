/* Chalk-icon data: the hand-drawn SVG glyphs that replace emojis in the Paper design.
   Rendering is done at the React level (see chalkify.tsx) to stay reconciliation-safe. */

export const CHALK_ICONS: Record<string, string> = {
  "🦷": '<path d="M8 5 c-3 0-4 3-3 7 c1 4 1 10 3 10 c2 0 1-5 3-5 c2 0 1 5 3 5 c2 0 2-6 3-10 c1-4 0-7-3-7 c-2 0-3 2-3 2 c0 0-1-2-3-2z"/>',
  "📌": '<circle cx="14" cy="10" r="5"/><line x1="14" y1="15" x2="14" y2="24"/>',
  "🔍": '<circle cx="12" cy="12" r="7"/><line x1="17" y1="17" x2="24" y2="24"/>',
  "🔥": '<path d="M14 4 c3 5 6 7 6 12 a6 6 0 0 1-12 0 c0-3 2-5 3-7 c1 2 2 2 3 1 c0-2-1-4 0-6z"/>',
  "📊": '<line x1="5" y1="23" x2="24" y2="23"/><rect x="7" y="13" width="3" height="10"/><rect x="13" y="8" width="3" height="15"/><rect x="19" y="16" width="3" height="7"/>',
  "⚙": '<circle cx="14" cy="14" r="4"/><path d="M14 4 v3 M14 21 v3 M4 14 h3 M21 14 h3 M7 7 l2 2 M19 19 l2 2 M21 7 l-2 2 M7 21 l2-2"/>',
  "🩺": '<path d="M7 4 v6 a5 5 0 0 0 10 0 v-6"/><path d="M12 20 a3 3 0 1 0 0-6"/><path d="M12 19 c0 3 3 4 6 4 a4 4 0 0 0 4-4 v-2"/><circle cx="22" cy="15" r="2"/>',
  "🧠": '<path d="M13 6 a4 4 0 0 0-7 2 a3 3 0 0 0-1 5 a3 3 0 0 0 4 4 a3 3 0 0 0 4 1 z"/><path d="M13 6 a4 4 0 0 1 7 2 a3 3 0 0 1 1 5 a3 3 0 0 1-4 4 a3 3 0 0 1-4 1 z"/><line x1="13" y1="6" x2="13" y2="22"/>',
  "⚠": '<path d="M14 5 L24 22 L4 22 Z"/><line x1="14" y1="11" x2="14" y2="17"/><circle class="fillc" cx="14" cy="20" r="1.1"/>',
  "📝": '<path d="M7 4 h10 a2 2 0 0 1 2 2 v16 l-3-2 -3 2 -3-2 -3 2 v-16 a2 2 0 0 1 2-2z"/><line x1="10" y1="10" x2="16" y2="10"/><line x1="10" y1="14" x2="16" y2="14"/>',
  "🎯": '<circle cx="14" cy="14" r="9"/><circle cx="14" cy="14" r="5"/><circle class="fillc" cx="14" cy="14" r="1.6"/>',
  "💡": '<path d="M14 4 a6 6 0 0 1 4 10 c-1 1-1 2-1 3 h-6 c0-1 0-2-1-3 a6 6 0 0 1 4-10z"/><line x1="11" y1="21" x2="17" y2="21"/><line x1="12" y1="24" x2="16" y2="24"/>',
  "📚": '<path d="M5 6 c3-1 6-1 8 0 v15 c-2-1-5-1-8 0z"/><path d="M21 6 c-3-1-6-1-8 0 v15 c2-1 5-1 8 0z"/>',
  "🃏": '<rect x="5" y="6" width="14" height="18" rx="2"/><rect x="9" y="4" width="14" height="18" rx="2"/>',
  "📁": '<path d="M4 8 h6 l2 3 h12 v11 h-20 z"/>',
  "📘": '<path d="M14 7 c-2-2-6-2-9-1 v14 c3-1 7-1 9 1 c2-2 6-2 9-1 v-14 c-3-1-7-1-9 1z"/><line x1="14" y1="7" x2="14" y2="21"/>',
  "📓": '<path d="M14 7 c-2-2-6-2-9-1 v14 c3-1 7-1 9 1 c2-2 6-2 9-1 v-14 c-3-1-7-1-9 1z"/><line x1="14" y1="7" x2="14" y2="21"/>',
  "📅": '<rect x="5" y="6" width="18" height="17" rx="2"/><line x1="5" y1="11" x2="23" y2="11"/><line x1="10" y1="4" x2="10" y2="8"/><line x1="18" y1="4" x2="18" y2="8"/>',
};

export const CHALK_ALT =
  "(" + Object.keys(CHALK_ICONS).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\uFE0F?";
