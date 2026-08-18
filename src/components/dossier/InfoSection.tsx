"use client";

import { checklistTotals } from "@/lib/checklist";
import type { Dossier } from "@/lib/types";
import { Icon } from "../Icon";

const fieldLabel = "mb-[5px] block text-xs text-text-dim";
const fieldInput =
  "w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text outline-none focus:border-text-faint";
const pillBase =
  "flex-1 rounded-[10px] border border-line bg-panel-2 py-[9px] text-center text-[13px] font-semibold text-text-dim";

export function InfoSection({
  dossier,
  onChange
}: {
  dossier: Dossier;
  onChange: (patch: Partial<Dossier>) => void;
}) {
  const totals = checklistTotals(dossier.gammes, dossier.produits, dossier.checklist, dossier.custom_items);

  function useGPS() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        onChange({ gps_lat: lat, gps_lng: lng, adresse: `${lat}, ${lng}` });
      },
      () => {
        /* ignore — permission denied or unavailable */
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="mb-3">
        <label className={fieldLabel}>Réf. KARLIA</label>
        <input
          className={fieldInput}
          value={dossier.ref_karlia}
          onChange={(e) => onChange({ ref_karlia: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className={fieldLabel}>Client final</label>
        <input
          className={fieldInput}
          value={dossier.client_final}
          onChange={(e) => onChange({ client_final: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className={fieldLabel}>Installateur</label>
        <input
          className={fieldInput}
          value={dossier.installateur}
          onChange={(e) => onChange({ installateur: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className={fieldLabel}>Installateur formé</label>
        <div className="flex gap-2">
          <button
            className={`${pillBase} ${dossier.installateur_forme === true ? "border-ok bg-ok/15 text-ok" : ""}`}
            onClick={() => onChange({ installateur_forme: true })}
          >
            Oui
          </button>
          <button
            className={`${pillBase} ${dossier.installateur_forme === false ? "border-danger bg-danger/15 text-danger" : ""}`}
            onClick={() => onChange({ installateur_forme: false })}
          >
            Non
          </button>
        </div>
        {dossier.installateur_forme === true && (
          <div className="mt-2.5">
            <label className={fieldLabel}>Date de formation</label>
            <input
              type="date"
              className={fieldInput}
              value={dossier.date_formation || ""}
              onChange={(e) => onChange({ date_formation: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className={fieldLabel}>Chantier vendu avec pose</label>
        <div className="flex gap-2">
          <button
            className={`${pillBase} ${dossier.vendu_avec_pose === true ? "border-ok bg-ok/15 text-ok" : ""}`}
            onClick={() => onChange({ vendu_avec_pose: true })}
          >
            Oui
          </button>
          <button
            className={`${pillBase} ${dossier.vendu_avec_pose === false ? "border-danger bg-danger/15 text-danger" : ""}`}
            onClick={() => onChange({ vendu_avec_pose: false })}
          >
            Non
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-2.5">
        <div className="flex-1">
          <label className={fieldLabel}>Date de fin de pose</label>
          <input
            type="date"
            className={fieldInput}
            value={dossier.date_fin_pose || ""}
            onChange={(e) => onChange({ date_fin_pose: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className={fieldLabel}>Date de contrôle</label>
          <input
            type="date"
            className={fieldInput}
            value={dossier.date_controle || ""}
            onChange={(e) => onChange({ date_controle: e.target.value })}
          />
        </div>
      </div>

      {totals.nonConforme > 0 && (
        <div className="mb-3">
          <label className={fieldLabel}>Date de conformité finale</label>
          <input
            type="date"
            className={fieldInput}
            value={dossier.date_conformite_finale || ""}
            onChange={(e) => onChange({ date_conformite_finale: e.target.value })}
          />
          <div className="mt-1 text-[11px] text-text-dim">À renseigner une fois les non-conformités corrigées</div>
        </div>
      )}

      <div>
        <label className={fieldLabel}>Adresse / Coordonnées GPS</label>
        <div className="flex gap-2">
          <input
            className={`${fieldInput} flex-1`}
            value={dossier.adresse}
            onChange={(e) => onChange({ adresse: e.target.value })}
            placeholder="Adresse ou lat, lng"
          />
          <button
            type="button"
            onClick={useGPS}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-line bg-panel-3 px-3 text-[12.5px] text-text"
          >
            <Icon.Pin className="h-4 w-4" /> GPS
          </button>
        </div>
      </div>
    </div>
  );
}
