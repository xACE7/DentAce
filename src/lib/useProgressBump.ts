"use client";
import { useEffect, useState } from "react";

/** Returns a counter that increments whenever progress changes (local edit or cloud
    sync). Include it in a view's effect deps to re-read progress live after a sync. */
export function useProgressBump(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV((x) => x + 1);
    window.addEventListener("dentace-progress", h);
    return () => window.removeEventListener("dentace-progress", h);
  }, []);
  return v;
}
