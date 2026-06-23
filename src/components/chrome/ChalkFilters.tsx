/* The chalk SVG filters referenced by paper.css (url(#chalkRough) etc.). Injected once,
   globally — identical to app.js CHALK_FILTERS / study.js FX. Static; server component. */
const DEFS = `
<filter id="chalkBig"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="6" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="3" result="r"/><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="2" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0.16" result="m"/><feComposite in="r" in2="m" operator="in"/></filter>
<filter id="chalkText"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="11" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="1.2" result="r"/><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="4" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0.62" result="m"/><feComposite in="r" in2="m" operator="in"/></filter>
<filter id="chalkRough"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="8" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="2.6" result="r"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="5" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0.05" result="m"/><feComposite in="r" in2="m" operator="in"/></filter>
<filter id="chalkShape"><feTurbulence type="fractalNoise" baseFrequency="0.022 0.03" numOctaves="2" seed="7" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" result="r"/><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="3" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0.38" result="m"/><feComposite in="r" in2="m" operator="in"/></filter>
`;

export function ChalkFilters() {
  return (
    <svg
      id="dchalk-defs"
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <defs dangerouslySetInnerHTML={{ __html: DEFS }} />
    </svg>
  );
}
