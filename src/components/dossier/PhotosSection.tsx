"use client";

import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Photo } from "@/lib/types";
import { compressImage } from "@/lib/image";
import { removePhoto as removePhotoAction, updatePhotoCaption, uploadPhoto } from "@/lib/dossierActions";
import { Icon } from "../Icon";

export function PhotosSection({
  dossierId,
  photos,
  onPhotosChange,
  supabase
}: {
  dossierId: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  supabase: SupabaseClient;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    let next = photos;
    for (let i = 0; i < files.length; i++) {
      try {
        const blob = await compressImage(files[i], 1280, 0.62);
        const photo = await uploadPhoto(supabase, dossierId, blob, next.length);
        next = [...next, photo];
      } catch (err) {
        console.error(err);
      }
    }
    onPhotosChange(next);
    setUploading(false);
  }

  async function handleRemove(photo: Photo) {
    try {
      await removePhotoAction(supabase, photo);
      onPhotosChange(photos.filter((p) => p.id !== photo.id));
      if (lightboxId === photo.id) setLightboxId(null);
    } catch (err) {
      console.error(err);
    }
  }

  const activePhoto = photos.find((p) => p.id === lightboxId) || null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-[10px] border border-line-soft bg-panel-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              onClick={() => setLightboxId(p.id)}
              className="h-full w-full cursor-pointer object-cover"
            />
            {p.caption && (
              <span className="absolute bottom-[5px] left-[5px] h-2 w-2 rounded-full bg-sun1 shadow-[0_0_0_2px_rgba(20,24,28,.65)]" />
            )}
            <button
              onClick={() => handleRemove(p)}
              className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-black/60 text-white"
            >
              <Icon.Cross className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-line text-[10.5px] text-text-dim disabled:opacity-60"
        >
          <Icon.Camera className="h-[22px] w-[22px]" />
          <span>{uploading ? "…" : "Ajouter"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {activePhoto && (
        <Lightbox
          photo={activePhoto}
          onClose={() => setLightboxId(null)}
          onCaptionChange={async (caption) => {
            onPhotosChange(photos.map((p) => (p.id === activePhoto.id ? { ...p, caption } : p)));
            try {
              await updatePhotoCaption(supabase, activePhoto.id, caption);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </div>
  );
}

function Lightbox({
  photo,
  onClose,
  onCaptionChange
}: {
  photo: Photo;
  onClose: () => void;
  onCaptionChange: (caption: string) => void;
}) {
  const [caption, setCaption] = useState(photo.caption);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(v: string) {
    setCaption(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onCaptionChange(v), 700);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute right-[18px] top-[18px] flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line bg-panel text-text"
      >
        <Icon.Cross className="h-4 w-4" />
      </button>
      <div className="flex w-full max-w-[480px] flex-col gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt="" className="mx-auto max-h-[60vh] rounded-xl object-contain" />
        <textarea
          value={caption}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Ajouter un commentaire pour cette photo (visible sur le rapport PDF)…"
          className="min-h-[64px] w-full rounded-[10px] border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] text-text outline-none"
        />
      </div>
    </div>
  );
}
