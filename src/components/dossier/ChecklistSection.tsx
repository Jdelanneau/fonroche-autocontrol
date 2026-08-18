"use client";

import { useState } from "react";
import { activeChecklistGroups, groupTotals, uid } from "@/lib/checklist";
import type { Checklist, CustomItem, Dossier } from "@/lib/types";
import { Icon } from "../Icon";

type Kind = "conforme" | "nonConforme";

export function ChecklistSection({
  dossier,
  onChange
}: {
  dossier: Dossier;
  onChange: (patch: Partial<Dossier> | ((d: Dossier) => Dossier)) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ structure: true, nowatt: true });
  const groups = activeChecklistGroups(dossier.gammes, dossier.produits);

  function toggleGroup(id: string) {
    setOpen((o) => ({ ...o, [id]: !o[id] }));
  }

  function toggleCheck(itemId: string, kind: Kind) {
    onChange((d) => {
      const cur = d.checklist[itemId] || { conforme: false, nonConforme: false, remarque: "" };
      const wasOn = cur[kind];
      const next: Checklist = {
        ...d.checklist,
        [itemId]: { ...cur, conforme: false, nonConforme: false, [kind]: !wasOn }
      };
      return { ...d, checklist: next };
    });
  }

  function setRemark(itemId: string, remarque: string) {
    onChange((d) => {
      const cur = d.checklist[itemId] || { conforme: false, nonConforme: false, remarque: "" };
      return { ...d, checklist: { ...d.checklist, [itemId]: { ...cur, remarque } } };
    });
  }

  function setHeure(itemId: string, heure: string) {
    onChange((d) => {
      const cur = d.checklist[itemId] || { conforme: false, nonConforme: false, remarque: "" };
      return { ...d, checklist: { ...d.checklist, [itemId]: { ...cur, heure } } };
    });
  }

  function toggleCustomCheck(id: string, kind: Kind) {
    onChange((d) => ({
      ...d,
      custom_items: d.custom_items.map((ci) =>
        ci.id === id ? { ...ci, conforme: false, nonConforme: false, [kind]: !ci[kind] } : ci
      )
    }));
  }

  function setCustomField(id: string, field: "label" | "remarque", value: string) {
    onChange((d) => ({
      ...d,
      custom_items: d.custom_items.map((ci) => (ci.id === id ? { ...ci, [field]: value } : ci))
    }));
  }

  function addCustomItem() {
    const item: CustomItem = { id: uid("ci"), label: "", conforme: false, nonConforme: false, remarque: "" };
    onChange((d) => ({ ...d, custom_items: [...d.custom_items, item] }));
  }

  function removeCustomItem(id: string) {
    onChange((d) => ({ ...d, custom_items: d.custom_items.filter((ci) => ci.id !== id) }));
  }

  return (
    <div>
      {groups.map((g) => {
        const gt = groupTotals(g, dossier.checklist);
        const isOpen = !!open[g.id];
        return (
          <div
            key={g.id}
            data-open={isOpen}
            className="mb-2.5 overflow-hidden rounded-2xl border border-line-soft bg-panel"
          >
            <button onClick={() => toggleGroup(g.id)} className="flex w-full items-center gap-2.5 px-3.5 py-[13px]">
              <span className="flex-1 text-left text-[15px] font-semibold">{g.title}</span>
              <span className="font-mono text-[11.5px] text-text-dim">
                {gt.done}/{gt.total}
              </span>
              <Icon.Chevron className="chevron-icon h-4 w-4 shrink-0 text-text-faint" />
            </button>
            <div className="group-body">
              <div className="px-3.5 pb-3">
                {g.items.map((it, idx) => {
                  const v = dossier.checklist[it.id] || { conforme: false, nonConforme: false, remarque: "" };
                  return (
                    <div key={it.id} className={`py-[11px] ${idx > 0 ? "border-t border-line-soft" : ""}`}>
                      <div className="mb-2 flex items-center gap-2 text-sm">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            v.conforme ? "bg-ok" : v.nonConforme ? "bg-danger" : "bg-text-faint"
                          }`}
                        />
                        {it.label}
                      </div>
                      <CheckPills conforme={v.conforme} nonConforme={v.nonConforme} onToggle={(kind) => toggleCheck(it.id, kind)} />
                      {it.hasTime && (
                        <div className="mt-2">
                          <label className="mb-1 block text-[11px] text-text-dim">Heure de la mesure</label>
                          <input
                            type="time"
                            value={v.heure || ""}
                            onChange={(e) => setHeure(it.id, e.target.value)}
                            className="w-full rounded-lg border border-line-soft bg-panel-2 px-2.5 py-2 text-[12.5px] text-text outline-none"
                          />
                        </div>
                      )}
                      <textarea
                        value={v.remarque}
                        onChange={(e) => setRemark(it.id, e.target.value)}
                        placeholder="Remarque (optionnel)"
                        className="mt-2 w-full rounded-lg border border-line-soft bg-panel-2 px-2.5 py-2 text-[12.5px] text-text-dim outline-none focus:text-text"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {dossier.custom_items.map((ci) => (
        <div key={ci.id} className="relative mb-2.5 rounded-2xl border border-line-soft bg-panel px-3.5 py-3">
          <button onClick={() => removeCustomItem(ci.id)} className="absolute right-3.5 top-[9px] p-1 text-text-faint">
            <Icon.Cross className="h-3.5 w-3.5" />
          </button>
          <input
            value={ci.label}
            onChange={(e) => setCustomField(ci.id, "label", e.target.value)}
            placeholder="Point de contrôle…"
            className="mb-2 w-full border-b border-dashed border-line bg-transparent pb-1.5 pr-6 text-sm text-text outline-none"
          />
          <CheckPills conforme={ci.conforme} nonConforme={ci.nonConforme} onToggle={(kind) => toggleCustomCheck(ci.id, kind)} />
          <textarea
            value={ci.remarque}
            onChange={(e) => setCustomField(ci.id, "remarque", e.target.value)}
            placeholder="Remarque (optionnel)"
            className="mt-2 w-full rounded-lg border border-line-soft bg-panel-2 px-2.5 py-2 text-[12.5px] text-text-dim outline-none focus:text-text"
          />
        </div>
      ))}

      <button
        onClick={addCustomItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-line py-2.5 text-[13px] text-text-dim"
      >
        <Icon.Plus className="h-[15px] w-[15px]" />
        Ajouter un point de contrôle
      </button>
    </div>
  );
}

function CheckPills({
  conforme,
  nonConforme,
  onToggle
}: {
  conforme: boolean;
  nonConforme: boolean;
  onToggle: (kind: Kind) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onToggle("conforme")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-[9px] border py-2 text-[12.5px] font-semibold ${
          conforme ? "border-ok bg-ok/15 text-ok" : "border-line bg-panel-2 text-text-dim"
        }`}
      >
        <Icon.Check className="h-[15px] w-[15px]" /> Conforme
      </button>
      <button
        onClick={() => onToggle("nonConforme")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-[9px] border py-2 text-[12.5px] font-semibold ${
          nonConforme ? "border-danger bg-danger/15 text-danger" : "border-line bg-panel-2 text-text-dim"
        }`}
      >
        <Icon.Cross className="h-[15px] w-[15px]" /> Non conforme
      </button>
    </div>
  );
}
