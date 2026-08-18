import type { SupabaseClient } from "@supabase/supabase-js";
import { blankGammes, computeDossierAggregates, ensureChecklistDefaults, todayISO, uid } from "./checklist";
import type { Dossier, Photo } from "./types";

/** Creates a fresh draft dossier and returns its id. */
export async function createDossier(supabase: SupabaseClient, userId: string): Promise<string> {
  const gammes = blankGammes();
  const checklist = ensureChecklistDefaults(gammes, [], {});
  const aggregates = computeDossierAggregates({ gammes, produits: [], checklist, custom_items: [] });

  const { data, error } = await supabase
    .from("dossiers")
    .insert({
      status: "brouillon",
      date_controle: todayISO(),
      gammes,
      produits: [],
      contacts: [],
      checklist,
      custom_items: [],
      created_by: userId,
      updated_by: userId,
      ...aggregates
    })
    .select("id")
    .single();

  if (error || !data) throw error || new Error("Création du dossier impossible");
  return data.id as string;
}

/** Persists a dossier, recomputing its cached conformity aggregates first. */
export async function saveDossier(supabase: SupabaseClient, dossier: Dossier, userId: string): Promise<void> {
  const aggregates = computeDossierAggregates(dossier);
  const { id, created_at, created_by, updated_at, ...rest } = dossier as any;
  const { error } = await supabase
    .from("dossiers")
    .update({ ...rest, ...aggregates, updated_by: userId })
    .eq("id", dossier.id);
  if (error) throw error;
}

export async function deleteDossierCascade(supabase: SupabaseClient, dossier: Dossier, photos: Photo[]): Promise<void> {
  if (photos.length) {
    await supabase.storage.from("photos").remove(photos.map((p) => p.path));
  }
  if (dossier.signature_url) {
    await supabase.storage.from("signatures").remove([`${dossier.id}.png`]);
  }
  // photos rows are removed automatically via ON DELETE CASCADE on dossier_id
  const { error } = await supabase.from("dossiers").delete().eq("id", dossier.id);
  if (error) throw error;
}

export async function deleteDossier(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("dossiers").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPhoto(
  supabase: SupabaseClient,
  dossierId: string,
  blob: Blob,
  position: number
): Promise<Photo> {
  const photoId = uid("p");
  const path = `${dossierId}/${photoId}.jpg`;

  const { error: uploadError } = await supabase.storage.from("photos").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true
  });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);

  const { data, error } = await supabase
    .from("photos")
    .insert({ dossier_id: dossierId, path, url: pub.publicUrl, caption: "", position })
    .select("*")
    .single();
  if (error || !data) throw error || new Error("Insertion de la photo impossible");
  return data as Photo;
}

export async function removePhoto(supabase: SupabaseClient, photo: Photo): Promise<void> {
  await supabase.storage.from("photos").remove([photo.path]);
  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) throw error;
}

export async function updatePhotoCaption(supabase: SupabaseClient, photoId: string, caption: string): Promise<void> {
  const { error } = await supabase.from("photos").update({ caption }).eq("id", photoId);
  if (error) throw error;
}

export async function uploadSignature(supabase: SupabaseClient, dossierId: string, blob: Blob): Promise<string> {
  const path = `${dossierId}.png`;
  const { error: uploadError } = await supabase.storage.from("signatures").upload(path, blob, {
    contentType: "image/png",
    upsert: true
  });
  if (uploadError) throw uploadError;
  const { data: pub } = supabase.storage.from("signatures").getPublicUrl(path);
  // Cache-bust so a re-signed image doesn't show a stale cached version.
  return `${pub.publicUrl}?t=${Date.now()}`;
}
