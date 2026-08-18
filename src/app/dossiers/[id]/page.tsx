import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DossierEditor } from "@/components/dossier/DossierEditor";
import type { Dossier, Photo, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DossierPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: dossier } = await supabase.from("dossiers").select("*").eq("id", params.id).single();
  if (!dossier) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("dossier_id", params.id)
    .order("position", { ascending: true });

  const { data: technicians } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("full_name", { ascending: true });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <DossierEditor
      initialDossier={dossier as Dossier}
      initialPhotos={(photos as Photo[]) || []}
      technicians={(technicians as Profile[]) || []}
      userId={user?.id || ""}
    />
  );
}
