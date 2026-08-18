"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checklistTotals } from "@/lib/checklist";
import { deleteDossierCascade, saveDossier } from "@/lib/dossierActions";
import { buildPdf, slug, summaryText } from "@/lib/pdf";
import type { Dossier, Photo, Profile } from "@/lib/types";
import { RingProgress } from "../RingProgress";
import { Icon } from "../Icon";
import { Section } from "./Section";
import { InfoSection } from "./InfoSection";
import { ProduitsSection } from "./ProduitsSection";
import { ConnectSection } from "./ConnectSection";
import { ChecklistSection } from "./ChecklistSection";
import { PhotosSection } from "./PhotosSection";
import { SignatureSection } from "./SignatureSection";
import { ShareFallbackModal } from "./ShareFallbackModal";

export function DossierEditor({
  initialDossier,
  initialPhotos,
  technicians,
  userId
}: {
  initialDossier: Dossier;
  initialPhotos: Photo[];
  technicians: Profile[];
  userId: string;
}) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [dossier, setDossier] = useState<Dossier>(initialDossier);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [shareFallback, setShareFallback] = useState<{ blob: Blob; filename: string; text: string } | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dossierRef = useRef(dossier);
  dossierRef.current = dossier;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const persist = useCallback(
    async (d: Dossier) => {
      try {
        await saveDossier(supabase, d, userId);
      } catch (err) {
        console.error(err);
      }
    },
    [supabase, userId]
  );

  function scheduleAutosave(next: Dossier) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next), 900);
  }

  function updateDossier(patch: Partial<Dossier> | ((d: Dossier) => Dossier)) {
    setDossier((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      scheduleAutosave(next);
      return next;
    });
  }

  /** Flushes any pending debounced save immediately (used before navigating away). */
  async function flushSave() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await persist(dossierRef.current);
  }

  async function handleBack() {
    await flushSave();
    router.push("/dossiers");
  }

  async function handleSaveAndClose() {
    await flushSave();
    router.push("/dossiers");
  }

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement le contrôle "${dossier.client_final || "sans nom"}" ?`)) return;
    try {
      await deleteDossierCascade(supabase, dossier, photos);
      router.push("/dossiers");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression");
    }
  }

  function setStatus(status: "brouillon" | "termine") {
    updateDossier({ status });
  }

  async function handleSendReport() {
    setSending(true);
    await flushSave();
    try {
      const doc = await buildPdf(dossierRef.current, photos);
      const blob = doc.output("blob");
      const filename = `Controle_${slug(dossier.client_final)}_${dossier.date_controle || ""}.pdf`;
      const text = summaryText(dossierRef.current);

      if (typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        try {
          const file = new File([blob], filename, { type: "application/pdf" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Fiche de contrôle chantier", text });
            setSending(false);
            showToast("Rapport partagé");
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === "AbortError") {
            setSending(false);
            return;
          }
          // fall through to the download/email/WhatsApp fallback below
        }
      }
      setShareFallback({ blob, filename, text });
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la génération du rapport");
    }
    setSending(false);
  }

  const totals = checklistTotals(dossier.gammes, dossier.produits, dossier.checklist, dossier.custom_items);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[560px] flex-col bg-night sm:min-h-[calc(100vh-48px)] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line-soft sm:py-6">
      <div className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-line-soft bg-night-2 px-3 py-3">
        <button
          onClick={handleBack}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] border border-line bg-panel text-text"
        >
          <Icon.Back className="h-[19px] w-[19px]" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-[18px] font-bold">{dossier.client_final || "Nouveau contrôle"}</div>
          <div className="truncate font-mono text-[11.5px] text-text-dim">{dossier.ref_karlia || "Réf. non renseignée"}</div>
        </div>
        <RingProgress percent={totals.percent} size={40} strokeWidth={4} />
        <button
          onClick={handleDelete}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] border border-line bg-panel text-text-faint"
        >
          <Icon.Trash className="h-[19px] w-[19px]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-[86px]">
        <div className="flex items-center gap-2 px-4 pt-3.5">
          <button
            onClick={() => setStatus("brouillon")}
            className={`flex-1 rounded-[10px] border border-line py-2.5 text-[12.5px] font-semibold ${
              dossier.status === "brouillon" ? "bg-text-dim/15 text-text" : "bg-panel text-text-dim"
            }`}
          >
            Brouillon
          </button>
          <button
            onClick={() => setStatus("termine")}
            className={`flex-1 rounded-[10px] border py-2.5 text-[12.5px] font-semibold ${
              dossier.status === "termine" ? "border-ok bg-ok/15 text-ok" : "border-line bg-panel text-text-dim"
            }`}
          >
            Terminé
          </button>
        </div>

        <Section title="Informations chantier">
          <InfoSection dossier={dossier} onChange={updateDossier} />
        </Section>

        <Section title="Produits installés">
          <ProduitsSection dossier={dossier} onChange={updateDossier} />
        </Section>

        <Section title="Fonroche Connect">
          <ConnectSection dossier={dossier} onChange={updateDossier} />
        </Section>

        <Section title="Contrôle qualité candélabre" badge={`${totals.done}/${totals.total}`}>
          <ChecklistSection dossier={dossier} onChange={updateDossier} />
        </Section>

        <Section title="Photos du chantier">
          <PhotosSection dossierId={dossier.id} photos={photos} onPhotosChange={setPhotos} supabase={supabase} />
        </Section>

        <Section title="Contrôleur & signature">
          <SignatureSection dossier={dossier} onChange={updateDossier} supabase={supabase} technicians={technicians} />
        </Section>
      </div>

      <div className="sticky bottom-0 z-20 flex gap-2.5 border-t border-line-soft bg-night-2 px-4 py-2.5 pb-[calc(10px+env(safe-area-inset-bottom))]">
        <button
          onClick={handleSaveAndClose}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-2 py-[13px] text-sm font-semibold text-text"
        >
          <Icon.Save className="h-4 w-4" /> Enregistrer
        </button>
        <button
          onClick={handleSendReport}
          disabled={sending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sun py-[13px] text-sm font-semibold text-[#1a1207] disabled:opacity-60"
        >
          <Icon.Send className="h-4 w-4" /> {sending ? "Génération…" : "Envoyer / Partager"}
        </button>
      </div>

      {toast && (
        <div className="toast-anim fixed bottom-[110px] left-1/2 z-[70] -translate-x-1/2 rounded-full border border-line bg-panel-3 px-4 py-2.5 text-[13px] text-text shadow-lg">
          {toast}
        </div>
      )}

      {shareFallback && (
        <ShareFallbackModal
          filename={shareFallback.filename}
          onDownload={() => {
            const url = URL.createObjectURL(shareFallback.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = shareFallback.filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            showToast("PDF téléchargé");
          }}
          onEmail={() => {
            const body = shareFallback.text + "\n\n(Pensez à joindre le PDF téléchargé.)";
            window.location.href =
              "mailto:?subject=" +
              encodeURIComponent("Fiche de contrôle chantier — Fonroche Lighting") +
              "&body=" +
              encodeURIComponent(body);
          }}
          onWhatsapp={() => {
            const text = shareFallback.text + "\n\n(PDF téléchargé, à joindre depuis vos fichiers.)";
            window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
          }}
          onClose={() => setShareFallback(null)}
        />
      )}
    </div>
  );
}
