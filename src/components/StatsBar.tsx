"use client";

import type { DossierSummary } from "@/lib/types";

export function StatsBar({
  dossiers,
  onFilter
}: {
  dossiers: DossierSummary[];
  onFilter: (filter: "termine" | "nonconforme" | "brouillon") => void;
}) {
  const termines = dossiers.filter((d) => d.status === "termine").length;
  const nonConformes = dossiers.filter((d) => (d.non_conforme_points || 0) > 0).length;
  const brouillons = dossiers.filter((d) => d.status === "brouillon").length;

  const cellClass =
    "flex-1 flex flex-col items-center gap-0.5 rounded-2xl border border-line-soft bg-panel px-1.5 py-2.5 active:bg-panel-2";

  return (
    <div className="flex gap-2 px-4 pb-1 pt-3.5">
      <button className={cellClass} onClick={() => onFilter("termine")}>
        <span className="font-display text-[22px] font-bold leading-none">{termines}</span>
        <span className="text-center text-[10.5px] tracking-wide text-text-dim">Terminés</span>
      </button>
      <button className={cellClass} onClick={() => onFilter("nonconforme")}>
        <span className="font-display text-[22px] font-bold leading-none text-danger">{nonConformes}</span>
        <span className="text-center text-[10.5px] tracking-wide text-text-dim">Non conformes</span>
      </button>
      <button className={cellClass} onClick={() => onFilter("brouillon")}>
        <span className="font-display text-[22px] font-bold leading-none">{brouillons}</span>
        <span className="text-center text-[10.5px] tracking-wide text-text-dim">Brouillons</span>
      </button>
    </div>
  );
}
