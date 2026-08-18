import type { Checklist, CustomItem, Dossier, Gammes, Produit } from "./types";

export interface ChecklistItemDef {
  id: string;
  label: string;
  /** When true, this item also collects a time value (e.g. time of measurement). */
  hasTime?: boolean;
}

export interface ChecklistGroupDef {
  id: string;
  title: string;
  items: ChecklistItemDef[];
}

/** Base checklist — applies to Smartlight and Skylight/Helia products. */
export const CHECKLIST_GROUPS: ChecklistGroupDef[] = [
  {
    id: "structure",
    title: "Structure & mât",
    items: [
      { id: "qte_mat", label: "Quantité Mât / POWER" },
      { id: "alignement", label: "Alignement visuel" },
      { id: "taille_massif", label: "Taille massif" },
      { id: "test_balancement", label: "Test mécanique balancement" },
      { id: "capuchon_mat", label: "Présence capuchon mât simple" },
      { id: "centrage_cross", label: "Centrage cross sur mât" }
    ]
  },
  {
    id: "visserie",
    title: "Visserie & fixations",
    items: [
      { id: "visserie_luminaire", label: "Visserie luminaire" },
      { id: "vis_blocage_batterie", label: "Vis de blocage batterie" },
      { id: "vis_serrage", label: "Présence vis de serrage" }
    ]
  },
  {
    id: "solaire",
    title: "Système solaire & électrique",
    items: [
      { id: "orientation_pv", label: "Orientation PV / ombrage" },
      { id: "cable_pv", label: "Câble PV" },
      { id: "mise_service", label: "Mise en service" },
      { id: "gateway", label: "Présence Gateway" },
      { id: "assiette_lentille", label: "Assiette lentille" }
    ]
  },
  {
    id: "identification",
    title: "Identification & traçabilité",
    items: [
      { id: "qr_pied", label: "QR code en pied" },
      { id: "autocollant_qr", label: "Autocollant protection QR code" },
      { id: "geoloc", label: "Géolocalisation réalisée" }
    ]
  },
  {
    id: "finitions",
    title: "Finitions",
    items: [
      { id: "peinture", label: "Peinture" },
      { id: "caches_tiges", label: "Caches tiges" },
      { id: "finitions_sol", label: "Finitions sol" }
    ]
  }
];

/** Dedicated checklist for the Nowatt range (bornes: Brut/Follow L/Follow Up — plots: Crystal/Oko). */
export const NOWATT_GROUP: ChecklistGroupDef = {
  id: "nowatt",
  title: "Contrôle qualité Nowatt",
  items: [
    {
      id: "nowatt_aplomb_assiette",
      label: "Aplomb (bornes : Brut / Follow L / Follow Up) / Assiette (plots : Crystal)"
    },
    { id: "nowatt_aspect_peinture", label: "Aspect / Peinture" },
    { id: "nowatt_collage_pv", label: "Collage PV" },
    { id: "nowatt_cycle_test", label: "Cycle « test » effectué" },
    { id: "nowatt_etat_charge", label: "État de charge", hasTime: true },
    { id: "nowatt_logiciel", label: "Logiciel à jour (v2.1.0 — code 46516 bornes / 2790 plots)" },
    { id: "nowatt_on", label: "En « ON »" }
  ]
};

export const GAMMES: Array<"Nowatt" | "Skylight" | "Smartlight"> = ["Nowatt", "Skylight", "Smartlight"];

export const GAMME_MODELES: Record<string, string[]> = {
  Smartlight: ["Essential", "Belle Epoque", "Opera", "New Art"],
  Skylight: ["Helia"],
  Nowatt: ["Crystal", "Follow L", "Brut", "Oko", "Follow Up"]
};

export const NIVEAUX_ACCES = ["Administrateur", "Superviseur", "Technicien", "Lecture seule"];

/**
 * The checklist groups that should be shown for a given dossier, given its
 * selected gammes/produits:
 * - The base checklist (Structure/Visserie/Solaire/Identification/Finitions)
 *   applies to Smartlight and Skylight/Helia, and is hidden when only Nowatt
 *   is selected (it doesn't apply to Nowatt at all).
 * - If the Helia model has actually been added as a product line, a
 *   dedicated "Balisage" group is appended (its own sub-menu, not merged
 *   into Finitions).
 * - If the Nowatt gamme is checked, its own dedicated checklist group is
 *   appended (additively — a chantier can combine Nowatt with Smartlight/
 *   Skylight products).
 */
export function activeChecklistGroups(gammes: Gammes | null | undefined, produits: Produit[] | null | undefined): ChecklistGroupDef[] {
  const g = gammes || { nowatt: false, skylight: false, smartlight: false };
  const onlyNowatt = !!g.nowatt && !g.smartlight && !g.skylight;

  const groups: ChecklistGroupDef[] = [];

  if (!onlyNowatt) {
    groups.push(...CHECKLIST_GROUPS.map((grp) => ({ id: grp.id, title: grp.title, items: grp.items.slice() })));
    const hasHelia = (produits || []).some((p) => p.modele === "Helia");
    if (hasHelia) {
      groups.push({ id: "balisage", title: "Balisage", items: [{ id: "balisage", label: "Balisage" }] });
    }
  }

  if (g.nowatt) {
    groups.push({ id: NOWATT_GROUP.id, title: NOWATT_GROUP.title, items: NOWATT_GROUP.items.slice() });
  }

  return groups;
}

export function isOnlyNowatt(gammes: Gammes | null | undefined): boolean {
  const g = gammes || { nowatt: false, skylight: false, smartlight: false };
  return !!g.nowatt && !g.smartlight && !g.skylight;
}

export interface ChecklistTotals {
  total: number;
  done: number;
  conforme: number;
  nonConforme: number;
  percent: number; // conformity level: conforme / total (NOT fill rate)
  fullyConforme: boolean;
}

export function checklistTotals(
  gammes: Gammes | null | undefined,
  produits: Produit[] | null | undefined,
  checklist: Checklist | null | undefined,
  customItems: CustomItem[] | null | undefined
): ChecklistTotals {
  const groups = activeChecklistGroups(gammes, produits);
  const cl = checklist || {};
  let total = 0;
  let conforme = 0;
  let nonConforme = 0;

  groups.forEach((g) => {
    g.items.forEach((it) => {
      total++;
      const v = cl[it.id];
      if (v) {
        if (v.conforme) conforme++;
        if (v.nonConforme) nonConforme++;
      }
    });
  });

  (customItems || []).forEach((ci) => {
    total++;
    if (ci.conforme) conforme++;
    if (ci.nonConforme) nonConforme++;
  });

  const done = conforme + nonConforme;
  return {
    total,
    done,
    conforme,
    nonConforme,
    percent: total ? Math.round((conforme / total) * 100) : 0,
    fullyConforme: total > 0 && conforme === total
  };
}

export function groupTotals(group: ChecklistGroupDef, checklist: Checklist | null | undefined) {
  const cl = checklist || {};
  let done = 0;
  group.items.forEach((it) => {
    const v = cl[it.id];
    if (v && (v.conforme || v.nonConforme)) done++;
  });
  return { total: group.items.length, done };
}

/** Ensures every currently-relevant checklist item has an entry, without wiping existing answers. */
export function ensureChecklistDefaults(
  gammes: Gammes | null | undefined,
  produits: Produit[] | null | undefined,
  checklist: Checklist | null | undefined
): Checklist {
  const groups = activeChecklistGroups(gammes, produits);
  const next: Checklist = { ...(checklist || {}) };
  groups.forEach((g) => {
    g.items.forEach((it) => {
      if (!next[it.id]) next[it.id] = { conforme: false, nonConforme: false, remarque: "", heure: it.hasTime ? "" : undefined };
    });
  });
  return next;
}

export function blankGammes(): Gammes {
  return { nowatt: false, skylight: false, smartlight: false };
}

/** Computes the summary fields cached on the dossier row (total/conforme/percent/etc). */
export function computeDossierAggregates(dossier: Pick<Dossier, "gammes" | "produits" | "checklist" | "custom_items">) {
  const totals = checklistTotals(dossier.gammes, dossier.produits, dossier.checklist, dossier.custom_items);
  return {
    total_points: totals.total,
    conforme_points: totals.conforme,
    non_conforme_points: totals.nonConforme,
    percent: totals.percent,
    fully_conforme: totals.fullyConforme
  };
}

export function initialsFromName(fullName: string | null | undefined): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function contactInitials(nom: string, prenom: string): string {
  const a = (prenom || "").trim()[0] || "";
  const b = (nom || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
}

export function formatDateFR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
