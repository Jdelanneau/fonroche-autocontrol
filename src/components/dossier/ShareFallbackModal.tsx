"use client";

import { Icon } from "../Icon";

export function ShareFallbackModal({
  filename,
  onDownload,
  onEmail,
  onWhatsapp,
  onClose
}: {
  filename: string;
  onDownload: () => void;
  onEmail: () => void;
  onWhatsapp: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] rounded-t-2xl border border-b-0 border-line-soft bg-night-2 p-4 pb-[calc(18px+env(safe-area-inset-bottom))] sm:rounded-2xl sm:border-b">
        <div className="mb-3.5 text-[19px] font-bold">Partager le rapport</div>
        <p className="mb-3.5 text-[12px] leading-relaxed text-text-dim">
          Le PDF a été téléchargé sur votre appareil. Choisissez un canal : le fichier sera à joindre
          manuellement dans l&rsquo;email ou la conversation WhatsApp qui s&rsquo;ouvre.
        </p>
        <button
          onClick={onDownload}
          className="mb-2 flex w-full items-center gap-3 rounded-xl border border-line bg-panel-2 px-3 py-[13px] text-sm font-semibold text-text"
        >
          <Icon.Download className="h-[19px] w-[19px]" /> Télécharger le PDF ({filename})
        </button>
        <button
          onClick={onEmail}
          className="mb-2 flex w-full items-center gap-3 rounded-xl border border-line bg-panel-2 px-3 py-[13px] text-sm font-semibold text-text"
        >
          <Icon.Mail className="h-[19px] w-[19px]" /> Envoyer par e-mail
        </button>
        <button
          onClick={onWhatsapp}
          className="flex w-full items-center gap-3 rounded-xl border border-line bg-panel-2 px-3 py-[13px] text-sm font-semibold text-text"
        >
          <Icon.Whatsapp className="h-[19px] w-[19px]" /> Envoyer par WhatsApp
        </button>
      </div>
    </div>
  );
}
