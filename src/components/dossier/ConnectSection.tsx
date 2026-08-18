"use client";

import { useState } from "react";
import { contactInitials, NIVEAUX_ACCES, uid } from "@/lib/checklist";
import type { Contact, Dossier } from "@/lib/types";
import { Icon } from "../Icon";

export function ConnectSection({
  dossier,
  onChange
}: {
  dossier: Dossier;
  onChange: (patch: Partial<Dossier> | ((d: Dossier) => Dossier)) => void;
}) {
  const [modal, setModal] = useState<{ mode: "new" | "edit"; data: Contact } | null>(null);

  function openNew() {
    setModal({ mode: "new", data: { id: uid("c"), nom: "", prenom: "", email: "", portable: "", niveau: "Technicien" } });
  }
  function openEdit(c: Contact) {
    setModal({ mode: "edit", data: { ...c } });
  }
  function remove(id: string) {
    if (!confirm("Supprimer cet interlocuteur ?")) return;
    onChange((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) }));
  }
  function save() {
    if (!modal) return;
    const { data } = modal;
    if (!data.nom && !data.prenom) return;
    onChange((d) => {
      const idx = d.contacts.findIndex((c) => c.id === data.id);
      const contacts = idx > -1 ? d.contacts.map((c) => (c.id === data.id ? data : c)) : [...d.contacts, data];
      return { ...d, contacts };
    });
    setModal(null);
  }

  return (
    <div>
      {dossier.contacts.length === 0 ? (
        <p className="mb-2.5 text-[12.5px] leading-relaxed text-text-dim">Aucun interlocuteur pour ce chantier.</p>
      ) : (
        dossier.contacts.map((c) => (
          <div key={c.id} className="mb-2.5 flex items-start gap-3 rounded-2xl border border-line-soft bg-panel-2 px-3.5 py-3.5">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-tealgrad text-sm font-bold text-[#06201c]">
              {contactInitials(c.nom, c.prenom)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">
                {c.prenom} {c.nom}
              </div>
              {c.email && <div className="mt-0.5 break-words text-[12.5px] text-text-dim">{c.email}</div>}
              {c.portable && <div className="mt-0.5 font-mono text-[12.5px] text-text-dim">{c.portable}</div>}
              <span className="mt-1.5 inline-block rounded-full bg-teal/15 px-[9px] py-[3px] text-[10.5px] font-semibold text-teal">
                {c.niveau}
              </span>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button onClick={() => openEdit(c)} className="p-1 text-text-faint">
                <Icon.Edit className="h-4 w-4" />
              </button>
              <button onClick={() => remove(c.id)} className="p-1 text-text-faint">
                <Icon.Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}

      <button
        onClick={openNew}
        className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-line py-2.5 text-[13px] text-text-dim"
      >
        <Icon.Plus className="h-[15px] w-[15px]" />
        Ajouter un interlocuteur
      </button>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="w-full max-w-[560px] rounded-t-2xl border border-b-0 border-line-soft bg-night-2 p-4 pb-[calc(18px+env(safe-area-inset-bottom))] sm:rounded-2xl sm:border-b">
            <div className="mb-3.5 text-[19px] font-bold">
              {modal.mode === "new" ? "Nouvel interlocuteur" : "Modifier l\u2019interlocuteur"}
            </div>
            <div className="mb-3 flex gap-2.5">
              <div className="flex-1">
                <label className="mb-[5px] block text-xs text-text-dim">Prénom</label>
                <input
                  className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
                  value={modal.data.prenom}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, prenom: e.target.value } })}
                />
              </div>
              <div className="flex-1">
                <label className="mb-[5px] block text-xs text-text-dim">Nom</label>
                <input
                  className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
                  value={modal.data.nom}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, nom: e.target.value } })}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-[5px] block text-xs text-text-dim">Email</label>
              <input
                type="email"
                className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
                value={modal.data.email}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })}
                placeholder="prenom.nom@fonroche-lighting.com"
              />
            </div>
            <div className="mb-3">
              <label className="mb-[5px] block text-xs text-text-dim">Portable</label>
              <input
                type="tel"
                className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
                value={modal.data.portable}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, portable: e.target.value } })}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div className="mb-1">
              <label className="mb-[5px] block text-xs text-text-dim">Niveau d&rsquo;accès</label>
              <select
                className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
                value={modal.data.niveau}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, niveau: e.target.value } })}
              >
                {NIVEAUX_ACCES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex gap-2.5">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-line bg-panel-2 py-[13px] text-sm font-semibold text-text"
              >
                Annuler
              </button>
              <button onClick={save} className="flex-1 rounded-xl bg-sun py-[13px] text-sm font-semibold text-[#1a1207]">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
