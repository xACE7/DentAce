/* Progress ring shown on subject cards (renderSemester) — done/total lectures. */
export function SubjectRing({ done, total }: { done: number; total: number }) {
  if (!total) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className={"subj-ring" + (pct === 100 ? " full" : "")} style={{ ["--p" as string]: pct }} title={`${done}/${total}`}>
      <i />
      <span>
        {pct}
        <small>%</small>
      </span>
    </div>
  );
}
