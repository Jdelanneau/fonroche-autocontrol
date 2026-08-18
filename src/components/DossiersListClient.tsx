"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBrand } from "./TopBrand";
import { StatsBar } from "./StatsBar";
import { DossierCard } from "./DossierCard";
import { Icon } from "./Icon";
import { createClient } from "@/lib/supabase/client";
import { createDossier } from "@/lib/dossierActions";
import type { DossierSummary } from "@/lib/types";

type Filter = "tous" | "brouillon" | "termine" | "nonconforme";

export function DossiersListClient({
  initialDossiers,
  userId
}: {
  initialDossiers: DossierSummary[];
  userId: string;
}) {
  const router = useRouter();
  const [dossiers] = useState(initialDossiers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("tous");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    let items = [...dossiers];
    if (filter === "nonconforme") items = items.filter((d) => (d.non_conforme_points || 0) > 0);
    else if (filter !== "tous") items = items.filter((d) => d.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (d) => (d.client_final || "").toLowerCase().includes(q) || (d.ref_karlia || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [dossiers, search, filter]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const supabase = createClient();
      const id = await createDossier(supabase, userId);
      router.push(`/dossiers/${id}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  }

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-[13px] py-1.5 text-[12.5px] ${
      active ? "border-text-faint bg-panel-3 text-text" : "border-line bg-panel text-text-dim"
    }`;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[560px] flex-col bg-night sm:min-h-[calc(100vh-48px)] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line-soft sm:py-6">
      <div className="flex items-center justify-between border-b border-line-soft bg-night-2">
        <TopBrand />
        <button onClick={handleLogout} className="mr-4 flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-line bg-panel text-text">
          <Icon.LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <StatsBar dossiers={dossiers} onFilter={(f) => setFilter(f)} />

        <div className="px-4 pb-0 pt-1">
          <h1 className="font-display text-[22px] font-bold">Contrôles chantier</h1>
        </div>

        <div className="px-4 pb-1 pt-2.5">
          <input
            className="w-full rounded-xl border border-line bg-panel px-3.5 py-[11px] text-[14.5px] text-text placeholder:text-text-faint"
            placeholder="Rechercher un client, une réf. KARLIA…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
          <button className={chipClass(filter === "tous")} onClick={() => setFilter("tous")}>
            Tous
          </button>
          <button className={chipClass(filter === "brouillon")} onClick={() => setFilter("brouillon")}>
            Brouillons
          </button>
          <button className={chipClass(filter === "termine")} onClick={() => setFilter("termine")}>
            Terminés
          </button>
          <button className={chipClass(filter === "nonconforme")} onClick={() => setFilter("nonconforme")}>
            Non conformes
          </button>
        </div>

        <div className="flex flex-col gap-2.5 px-4 pb-24 pt-1.5">
          {dossiers.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : filtered.length === 0 ? (
            <div className="mx-2 mt-6 rounded-2xl border border-dashed border-line px-5 py-8 text-center text-text-dim">
              <div className="font-display mb-1.5 text-xl">Aucun résultat</div>
              <p className="text-[13.5px] leading-relaxed">Aucun chantier ne correspond à cette recherche.</p>
            </div>
          ) : (
            filtered.map((d) => <DossierCard key={d.id} d={d} />)
          )}
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={creating}
        aria-label="Nouveau contrôle"
        className="absolute bottom-[22px] right-[18px] z-10 flex h-14 w-14 items-center justify-center rounded-full bg-sun shadow-lg shadow-orange-900/30 disabled:opacity-60"
      >
        <Icon.Plus className="h-[26px] w-[26px] text-[#1a1207]" />
      </button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mx-2 mt-6 rounded-2xl border border-dashed border-line px-5 py-8 text-center text-text-dim">
      <div className="font-display mb-1.5 text-xl text-text">Aucun contrôle enregistré</div>
      <p className="mb-4 text-[13.5px] leading-relaxed">
        Créez votre premier contrôle chantier pour commencer le suivi de conformité des candélabres installés.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 rounded-xl bg-sun px-5 py-[11px] text-sm font-semibold text-[#1a1207]"
      >
        <Icon.Plus className="h-4 w-4" />
        Nouveau contrôle
      </button>
    </div>
  );
}
