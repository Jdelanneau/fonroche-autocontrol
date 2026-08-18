"use client";

import { useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateFR, todayISO } from "@/lib/checklist";
import { uploadSignature } from "@/lib/dossierActions";
import type { Dossier, Profile } from "@/lib/types";

export function SignatureSection({
  dossier,
  onChange,
  supabase,
  technicians
}: {
  dossier: Dossier;
  onChange: (patch: Partial<Dossier>) => void;
  supabase: SupabaseClient;
  technicians: Profile[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1C2126";
    ctxRef.current = ctx;

    if (dossier.signature_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = dossier.signature_url;
    }
    // Only re-init on mount: re-running this on every dossier change would wipe
    // in-progress strokes, so signature_url is intentionally read once here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasStrokeRef.current = true;
  }
  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (!hasStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const url = await uploadSignature(supabase, dossier.id, blob);
        onChange({ signature_url: url, signature_date: todayISO() });
      } catch (err) {
        console.error(err);
      }
    }, "image/png");
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasStrokeRef.current = false;
    onChange({ signature_url: null, signature_date: null });
  }

  return (
    <div>
      <div className="mb-3 flex gap-2.5">
        <div className="flex-1">
          <label className="mb-[5px] block text-xs text-text-dim">Contrôleur</label>
          <select
            className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
            value={dossier.controleur_nom}
            onChange={(e) => onChange({ controleur_nom: e.target.value })}
          >
            <option value="">Sélectionner un contrôleur…</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.full_name || ""}>
                {t.full_name || "(sans nom)"}
              </option>
            ))}
            {dossier.controleur_nom && !technicians.some((t) => t.full_name === dossier.controleur_nom) && (
              <option value={dossier.controleur_nom}>{dossier.controleur_nom}</option>
            )}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-[5px] block text-xs text-text-dim">Entreprise</label>
          <input
            className="w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[14.5px] text-text"
            value={dossier.controleur_entreprise}
            onChange={(e) => onChange({ controleur_entreprise: e.target.value })}
          />
        </div>
      </div>

      <label className="mb-[5px] block text-xs text-text-dim">Signature</label>
      <div className="overflow-hidden rounded-xl border border-line">
        <canvas
          ref={canvasRef}
          className="block h-[160px] w-full touch-none bg-paper"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11.5px] text-text-faint">
          {dossier.signature_date ? `Signé le ${formatDateFR(dossier.signature_date)}` : "Signez avec le doigt ou la souris"}
        </span>
        <button onClick={clear} className="py-1 text-[12.5px] font-semibold text-teal">
          Effacer
        </button>
      </div>
    </div>
  );
}
