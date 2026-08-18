"use client";

import { GAMMES, GAMME_MODELES, uid } from "@/lib/checklist";
import type { Dossier, Gammes, Produit } from "@/lib/types";
import { Icon } from "../Icon";

export function ProduitsSection({
  dossier,
  onChange
}: {
  dossier: Dossier;
  onChange: (patch: Partial<Dossier> | ((d: Dossier) => Dossier)) => void;
}) {
  const gammes = dossier.gammes;

  function toggleGamme(name: string) {
    const key = name.toLowerCase() as keyof Gammes;
    onChange((d) => ({ ...d, gammes: { ...d.gammes, [key]: !d.gammes[key] } }));
  }

  function addProduit(gamme: string, modele: string) {
    if (!modele) return;
    const line: Produit = { id: uid("pr"), gamme: gamme as Produit["gamme"], modele, quantite: "" };
    onChange((d) => ({ ...d, produits: [...d.produits, line] }));
  }

  function removeProduit(id: string) {
    onChange((d) => ({ ...d, produits: d.produits.filter((p) => p.id !== id) }));
  }

  function setQuantite(id: string, quantite: string) {
    onChange((d) => ({ ...d, produits: d.produits.map((p) => (p.id === id ? { ...p, quantite } : p)) }));
  }

  return (
    <div>
      <div className="mb-3">
        <label className="mb-[5px] block text-xs text-text-dim">Gamme(s) produit</label>
        <div className="flex gap-2">
          {GAMMES.map((name) => {
            const on = !!gammes[name.toLowerCase() as keyof Gammes];
            return (
              <button
                key={name}
                onClick={() => toggleGamme(name)}
                className={`flex-1 rounded-[10px] border py-[9px] text-center text-[13px] font-semibold ${
                  on ? "border-teal bg-teal/15 text-teal" : "border-line bg-panel-2 text-text-dim"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {GAMMES.filter((name) => gammes[name.toLowerCase() as keyof Gammes]).map((name) => (
        <div className="mb-3" key={name}>
          <label className="mb-[5px] block text-xs text-text-dim">Modèle {name}</label>
          <select
            defaultValue=""
            onChange={(e) => {
              addProduit(name, e.target.value);
              e.target.value = "";
            }}
            className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
          >
            <option value="">Choisir un modèle…</option>
            {GAMME_MODELES[name].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      ))}

      {dossier.produits.length === 0 ? (
        <p className="text-[12.5px] leading-relaxed text-text-dim">
          Sélectionnez une gamme ci-dessus puis choisissez un modèle pour l&rsquo;ajouter ici.
        </p>
      ) : (
        <div>
          {dossier.produits.map((p) => (
            <div key={p.id} className="flex items-center gap-2 border-t border-line-soft py-[9px] first:border-t-0">
              <div className="min-w-0 flex-1 text-[13.5px]">
                {p.gamme} <span className="font-mono">{p.modele}</span>
              </div>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Qté"
                value={p.quantite}
                onChange={(e) => setQuantite(p.id, e.target.value)}
                className="w-[60px] shrink-0 rounded-lg border border-line bg-panel-2 px-1.5 py-[7px] text-center text-[13px] text-text"
              />
              <button onClick={() => removeProduit(p.id)} className="shrink-0 p-1 text-text-faint">
                <Icon.Cross className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
