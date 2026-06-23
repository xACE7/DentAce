/* Port of app.js confetti() — a one-shot burst when a list hits 100%. Client-only. */
export function confetti() {
  if (typeof document === "undefined" || document.getElementById("dconf")) return;
  const wrap = document.createElement("div");
  wrap.id = "dconf";
  wrap.className = "confetti";
  wrap.setAttribute("aria-hidden", "true");
  const colors = ["#ff2bd6", "#22d3ee", "#22c55e", "#a855f7", "#f59e0b", "#ff6fa5"];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s";
    p.style.transform = "rotate(" + Math.floor(Math.random() * 360) + "deg)";
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => { if (wrap.parentNode) wrap.remove(); }, 3600);
}
