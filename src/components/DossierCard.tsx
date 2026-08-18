"use client";

import Link from "next/link";
import { RingProgress } from "./RingProgress";
import { initialsFromName, formatDateFR } from "@/lib/checklist";
import type { DossierSummary } from "@/lib/types";

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px]">
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

export function DossierCard({ d }: { d: DossierSummary }) {
  const statusLabel = d.status === "termine" ? "Terminé" : "Brouillon";
  const ctrlInit = initialsFromName(d.controleur_nom);
  const isDanger = (d.non_conforme_points || 0) > 0;
  const showAlert = !d.fully_conforme;
  const alertLabel = isDanger
    ? `${d.non_conforme_points} point${d.non_conforme_points > 1 ? "s" : ""} non conforme${d.non_conforme_points > 1 ? "s" : ""}`
    : "Contrôle incomplet";

  return (
    <Link
      href={`/dossiers/${d.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line-soft bg-panel px-3 py-[11px] text-left active:bg-panel-2"
    >
      <RingProgress percent={d.percent} size={44} strokeWidth={4} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{d.client_final || "Client non renseigné"}</div>
        <div className="truncate text-xs text-text-dim">
          <span className="font-mono">{d.ref_karlia || "—"}</span> · {formatDateFR(d.date_controle)}
        </div>
      </div>
      {ctrlInit && (
        <div
          title={d.controleur_nom || ""}
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-sun text-[11.5px] font-bold text-[#1a1207]"
        >
          {ctrlInit}
        </div>
      )}
      {showAlert && (
        <span
          title={alertLabel}
          className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ${
            isDanger ? "bg-danger/15 text-danger" : "bg-sun1/15 text-sun1"
          }`}
        >
          <AlertIcon />
        </span>
      )}
      <span
        className={`shrink-0 rounded-full px-[9px] py-1 text-[10.5px] font-semibold tracking-wide ${
          d.status === "termine" ? "bg-ok/15 text-ok" : "bg-text-dim/15 text-text-dim"
        }`}
      >
        {statusLabel}
      </span>
    </Link>
  );
}
